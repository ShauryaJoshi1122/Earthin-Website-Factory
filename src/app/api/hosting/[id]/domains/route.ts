import { NextRequest, NextResponse } from 'next/server';
import { db, hostingConnections } from '@/db';
import { eq } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth';
import { decryptSecret } from '@/lib/crypto';
import { CpanelDomainAdapter } from '@/services/cpanel';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const hostingId = parseInt(id, 10);
  if (isNaN(hostingId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const conn = (await db.select().from(hostingConnections).where(eq(hostingConnections.id, hostingId)).limit(1))[0];
    if (!conn) return NextResponse.json({ error: 'Hosting connection not found' }, { status: 404 });

    const apiToken = decryptSecret(conn.apiTokenEncrypted);
    const domainAdapter = new CpanelDomainAdapter({
      serverUrl: conn.serverUrl,
      username: conn.username,
      apiToken,
    });

    const domains = await domainAdapter.listDomains();
    return NextResponse.json({ domains });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
