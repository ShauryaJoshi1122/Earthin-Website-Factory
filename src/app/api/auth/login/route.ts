import { NextRequest, NextResponse } from 'next/server';
import { db, users, userRoles, roles } from '@/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession, logAudit } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Valid email and password are required.' }, { status: 400 });
    }

    const { email, password } = result.data;
    const userRows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or user does not exist.' }, { status: 401 });
    }

    const user = userRows[0];
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Your account is suspended or inactive.' }, { status: 403 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Update last login
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Create session
    const ip = req.headers.get('x-forwarded-for') || undefined;
    const ua = req.headers.get('user-agent') || undefined;
    await createSession(user.id, ip, ua);

    await logAudit(user.id, 'auth.login', 'user', String(user.id), { email: user.email }, ip, ua);

    // Fetch primary role
    const roleRows = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleRows[0]?.roleName || 'VIEWER',
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Authentication failed' }, { status: 500 });
  }
}
