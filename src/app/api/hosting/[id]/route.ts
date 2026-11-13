import { NextRequest, NextResponse } from 'next/server';
import { db, hostingConnections, websites } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'hosting.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const hostingId = parseInt(id, 10);
  if (isNaN(hostingId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if websites are bound
    const boundWebsites = await db.select().from(websites).where(eq(websites.hostingConnectionId, hostingId)).limit(1);
    if (boundWebsites.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete hosting connection because active websites are bound to it. Migrate or delete websites first.' },
        { status: 400 }
      );
    }

    await db.delete(hostingConnections).where(eq(hostingConnections.id, hostingId));
    await logAudit(user.id, 'hosting.deleted', 'hosting_connection', String(hostingId));

    return NextResponse.json({ success: true, message: 'Hosting connection deleted.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
