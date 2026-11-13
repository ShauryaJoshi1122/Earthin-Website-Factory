import { NextResponse } from 'next/server';
import { destroySession, getSessionUser, logAudit } from '@/lib/auth';

export async function POST() {
  const user = await getSessionUser();
  if (user) {
    await logAudit(user.id, 'auth.logout', 'user', String(user.id));
  }
  await destroySession();
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}
