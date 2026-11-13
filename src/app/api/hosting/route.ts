import { NextRequest, NextResponse } from 'next/server';
import { db, hostingConnections, hostingCapabilities } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getSessionUser, checkPermission, logAudit } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import { CpanelConnectionAdapter } from '@/services/cpanel';
import { CONFIG } from '@/lib/config';
import { z } from 'zod';

const createHostingSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['internal_cpanel', 'external_cpanel']).default('internal_cpanel'),
  serverUrl: z.string().url(),
  username: z.string().min(2),
  apiToken: z.string().min(5),
  authType: z.enum(['api_token', 'password']).default('api_token'),
  maxConcurrentDeployments: z.number().int().min(1).max(10).default(2),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!CONFIG.DATABASE_URL) {
    return NextResponse.json({
      connections: [
        {
          id: 1,
          name: 'Earthin Main cPanel (Local Demo)',
          type: 'internal_cpanel',
          serverUrl: 'https://cpanel.earthin.online:2083',
          username: 'earthin',
          status: 'active',
          maxConcurrentDeployments: 2,
          capabilities: {
            phpVersion: '8.3',
            mysqlVersion: '8.0',
            hasMysqlCreateDb: true,
            hasMysqlCreateUser: true,
            hasFileman: true,
            hasSslSupport: true,
            detectedDomains: ['samachar.earthin.online', 'patrika.earthin.online'],
          },
        },
      ],
    });
  }

  try {
    const list = await db
      .select({
        id: hostingConnections.id,
        name: hostingConnections.name,
        type: hostingConnections.type,
        serverUrl: hostingConnections.serverUrl,
        username: hostingConnections.username,
        status: hostingConnections.status,
        maxConcurrentDeployments: hostingConnections.maxConcurrentDeployments,
        lastTestedAt: hostingConnections.lastTestedAt,
        lastError: hostingConnections.lastError,
        createdAt: hostingConnections.createdAt,
        capabilities: {
          phpVersion: hostingCapabilities.phpVersion,
          mysqlVersion: hostingCapabilities.mysqlVersion,
          hasMysqlCreateDb: hostingCapabilities.hasMysqlCreateDb,
          hasMysqlCreateUser: hostingCapabilities.hasMysqlCreateUser,
          hasFileman: hostingCapabilities.hasFileman,
          hasSslSupport: hostingCapabilities.hasSslSupport,
          diskUsedMb: hostingCapabilities.diskUsedMb,
          diskTotalMb: hostingCapabilities.diskTotalMb,
          detectedDomains: hostingCapabilities.detectedDomains,
        },
      })
      .from(hostingConnections)
      .leftJoin(hostingCapabilities, eq(hostingConnections.id, hostingCapabilities.hostingConnectionId))
      .orderBy(desc(hostingConnections.createdAt));

    return NextResponse.json({ connections: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !checkPermission(user, 'hosting.manage')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to add hosting.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createHostingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid hosting connection input: ' + result.error.message }, { status: 400 });
    }

    const { name, type, serverUrl, username, apiToken, authType, maxConcurrentDeployments } = result.data;

    // Encrypt sensitive API Token with AES-256-GCM
    const apiTokenEncrypted = encryptSecret(apiToken);

    // Initial capability test
    let caps;
    let initialStatus = 'active';
    let lastError: string | null = null;
    try {
      const adapter = new CpanelConnectionAdapter({ serverUrl, username, apiToken, authType });
      caps = await adapter.testAndDetectCapabilities();
    } catch (testErr: any) {
      initialStatus = 'error';
      lastError = testErr.message;
    }

    const inserted = await db
      .insert(hostingConnections)
      .values({
        name,
        type,
        serverUrl,
        username,
        apiTokenEncrypted,
        authType,
        status: initialStatus,
        lastTestedAt: new Date(),
        lastError,
        maxConcurrentDeployments,
        createdByUserId: user.id,
      })
      .returning();

    const connection = inserted[0];

    if (caps) {
      await db.insert(hostingCapabilities).values({
        hostingConnectionId: connection.id,
        phpVersion: caps.phpVersion,
        mysqlVersion: caps.mysqlVersion,
        hasMysqlCreateDb: caps.hasMysqlCreateDb,
        hasMysqlCreateUser: caps.hasMysqlCreateUser,
        hasFileman: caps.hasFileman,
        hasSslSupport: caps.hasSslSupport,
        diskUsedMb: caps.diskUsedMb,
        diskTotalMb: caps.diskTotalMb,
        detectedDomains: caps.detectedDomains,
        rawDetails: caps.rawDetails,
      });
    }

    await logAudit(user.id, 'hosting.created', 'hosting_connection', String(connection.id), {
      name,
      serverUrl,
      username,
    });

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        serverUrl: connection.serverUrl,
        username: connection.username,
        status: connection.status,
        lastError: connection.lastError,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
