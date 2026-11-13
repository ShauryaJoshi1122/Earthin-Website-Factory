import { createRealtime, rawSql } from '@neon/realtime/server';

const isNeonRealtimeConfigured = Boolean(
  process.env.NEON_REALTIME_SECRET && process.env.NEON_REALTIME_URL
);

export const realtimeServer = isNeonRealtimeConfigured
  ? createRealtime({
      secret: process.env.NEON_REALTIME_SECRET!,
      db: 'neondb',
    })
  : null;

/**
 * Generates a cryptographically signed sealed query token for client subscription over WebSocket
 */
export async function sealLiveQuery(sql: string, params: any[] = []) {
  if (!realtimeServer) {
    throw new Error('Neon Realtime is not configured (missing NEON_REALTIME_SECRET or NEON_REALTIME_URL).');
  }

  const query = rawSql(sql, params);
  const sealed = await realtimeServer.seal({ query });
  return {
    sealedQuery: sealed,
    url: process.env.NEON_REALTIME_URL!,
  };
}
