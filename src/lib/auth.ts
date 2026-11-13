import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, users, sessions, userRoles, roles, rolePermissions, permissions, auditLogs } from '@/db';
import { eq, and, gt } from 'drizzle-orm';

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'earthin_factory_dev_secret_replace_in_production_32chars!'
);
export const SESSION_COOKIE_NAME = 'earthin_factory_session';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  permissions: string[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, ipAddress?: string, userAgent?: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(AUTH_SECRET);

  try {
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (err) {
    console.error('Failed to persist session to database:', err);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch {}
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, AUTH_SECRET);
    const userId = payload.userId as number;
    if (!userId) return null;

    // Fetch user from DB
    const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRows || userRows.length === 0) return null;

    const user = userRows[0];
    if (user.status !== 'active') return null;

    // Fetch user role
    const userRoleRows = await db
      .select({ roleName: roles.name, roleId: roles.id })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id))
      .limit(1);

    const primaryRole = userRoleRows[0]?.roleName || 'VIEWER';
    const roleId = userRoleRows[0]?.roleId;

    // Fetch permissions
    let userPermissions: string[] = [];
    if (roleId) {
      const permRows = await db
        .select({ slug: permissions.slug })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
      userPermissions = (permRows as Array<{ slug: string }>).map((p: { slug: string }) => p.slug);
    }

    // Super admin inherently has all permissions
    if (primaryRole === 'SUPER_ADMIN') {
      userPermissions = ['*'];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: primaryRole,
      permissions: userPermissions,
    };
  } catch (err) {
    return null;
  }
}

export function checkPermission(user: AuthUser | null, requiredPermission: string): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(requiredPermission);
}

export function checkRole(user: AuthUser | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}

export async function logAudit(
  userId: number | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      resourceType,
      resourceId: resourceId || null,
      details: details || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
