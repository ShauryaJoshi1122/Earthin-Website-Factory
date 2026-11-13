import { NextResponse } from 'next/server';
import { db, auditLogs, users } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ activity: [] });
  }

  try {
    const activity = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return NextResponse.json({ activity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch activity' }, { status: 500 });
  }
}
