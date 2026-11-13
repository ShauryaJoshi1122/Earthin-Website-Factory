import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { uploadAsset, downloadAsset, deleteAsset, listAssets, isNeonStorageAvailable } from '@/lib/storage';
import { sealLiveQuery } from '@/lib/realtime';
import { CONFIG } from '@/lib/config';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    postgres: { status: 'pending' },
    objectStorage: { status: 'pending' },
    realtime: { status: 'pending' },
  };

  // 1. Verify Postgres
  try {
    const userRows = await db.select({ id: users.id, email: users.email }).from(users).limit(1);
    results.postgres = {
      status: 'ok',
      branch: process.env.NEON_BRANCH || 'production',
      userCountSample: userRows.length,
      sampleUser: userRows[0]?.email || null,
    };
  } catch (err: any) {
    results.postgres = {
      status: 'error',
      error: err.message,
    };
  }

  // 2. Verify Object Storage
  try {
    if (!isNeonStorageAvailable) {
      results.objectStorage = {
        status: 'skipped',
        message: 'Neon storage env vars not configured',
      };
    } else {
      const testKey = `verify/check-${Date.now()}.txt`;
      const testPayload = `Neon S3 verification ping at ${new Date().toISOString()}`;
      
      const upload = await uploadAsset(testKey, testPayload, {
        contentType: 'text/plain',
        bucket: 'assets',
      });

      const downloaded = await downloadAsset(testKey, 'assets');
      const matches = downloaded.buffer.toString('utf-8') === testPayload;

      // Clean up test file
      await deleteAsset(testKey, 'assets');

      results.objectStorage = {
        status: matches ? 'ok' : 'mismatch',
        bucket: 'assets',
        endpoint: CONFIG.AWS_ENDPOINT_URL_S3,
        provider: upload.provider,
        verifiedReadWrite: matches,
      };
    }
  } catch (err: any) {
    results.objectStorage = {
      status: 'error',
      error: err.message,
    };
  }

  // 3. Verify Realtime
  try {
    const { sealedQuery, url } = await sealLiveQuery('SELECT id, name, email FROM users LIMIT 1');
    results.realtime = {
      status: 'ok',
      websocketUrl: url,
      sealedQueryGenerated: Boolean(sealedQuery),
    };
  } catch (err: any) {
    results.realtime = {
      status: 'error',
      error: err.message,
    };
  }

  const allPassed =
    results.postgres.status === 'ok' &&
    results.objectStorage.status === 'ok' &&
    results.realtime.status === 'ok';

  return NextResponse.json(
    {
      success: allPassed,
      results,
    },
    { status: allPassed ? 200 : 500 }
  );
}

