import { NextResponse } from 'next/server';
import { db, notifications } from '@/db';
import { eq, or, isNull } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(or(eq(notifications.userId, user.id), isNull(notifications.userId)));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
