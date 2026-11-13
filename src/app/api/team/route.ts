import { NextRequest, NextResponse } from 'next/server';
import { db, users, userRoles, roles } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser, checkPermission, hashPassword, logAudit } from '@/lib/auth';
import { z } from 'zod';

const createMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'WEBSITE_OPERATOR', 'VIEWER']).default('WEBSITE_OPERATOR'),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'team.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const list = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        role: roles.name,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ team: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'team.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createMemberSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input: ' + result.error.message }, { status: 400 });
    }

    const { name, email, password, role } = result.data;
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A team member with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        status: 'active',
      })
      .returning();

    const newMember = inserted[0];

    const roleRow = (await db.select().from(roles).where(eq(roles.name, role)).limit(1))[0];
    if (roleRow) {
      await db.insert(userRoles).values({
        userId: newMember.id,
        roleId: roleRow.id,
      });
    }

    await logAudit(user.id, 'team.member_created', 'user', String(newMember.id), {
      email,
      role,
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role,
        status: newMember.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
