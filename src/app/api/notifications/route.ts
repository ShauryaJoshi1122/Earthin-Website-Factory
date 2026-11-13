import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { eq, or, isNull, desc } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await db
      .select()
      .from(notifications)
      .where(or(eq(notifications.userId, user.id), isNull(notifications.userId)))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return NextResponse.json({ notifications: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
