import { NextResponse } from 'next/server';
import { db, auditLogs, users } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser, checkPermission } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'audit.view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
