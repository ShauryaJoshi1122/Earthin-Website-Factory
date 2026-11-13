import { NextRequest, NextResponse } from 'next/server';
import { CpanelConnectionAdapter } from '@/services/cpanel';
import { getSessionUser } from '@/lib/auth';
import { db, hostingConnections } from '@/db';
import { eq } from 'drizzle-orm';
import { decryptSecret } from '@/lib/crypto';
import { z } from 'zod';

const testSchema = z.object({
  id: z.number().optional(),
  serverUrl: z.string().optional(),
  username: z.string().optional(),
  apiToken: z.string().optional(),
  authType: z.enum(['api_token', 'password']).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const result = testSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    let { id, serverUrl, username, apiToken, authType } = result.data;

    // If testing an existing connection by ID
    if (id) {
      const conn = (await db.select().from(hostingConnections).where(eq(hostingConnections.id, id)).limit(1))[0];
      if (!conn) return NextResponse.json({ error: 'Hosting connection not found' }, { status: 404 });
      serverUrl = conn.serverUrl;
      username = conn.username;
      apiToken = decryptSecret(conn.apiTokenEncrypted);
      authType = (conn.authType as 'api_token' | 'password') || 'api_token';
    }

    if (!serverUrl || !username || !apiToken) {
      return NextResponse.json({ error: 'Server URL, username, and API token/password are required to test.' }, { status: 400 });
    }

    const adapter = new CpanelConnectionAdapter({
      serverUrl,
      username,
      apiToken,
      authType: authType || 'api_token',
    });

    const capabilities = await adapter.testAndDetectCapabilities();

    if (id) {
      await db
        .update(hostingConnections)
        .set({
          status: 'active',
          lastTestedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(hostingConnections.id, id));
    }

    return NextResponse.json({
      success: true,
      message: 'cPanel connection authenticated successfully.',
      capabilities,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Connection test failed',
      },
      { status: 422 }
    );
  }
}
