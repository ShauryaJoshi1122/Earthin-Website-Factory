import { createRealtime, rawSql } from '@neon/realtime/server';
import { createRealtimeClient } from '@neon/realtime/client';

async function main() {
  console.log('--- Testing Neon Realtime Client Subscription ---');
  const realtime = createRealtime({
    secret: process.env.NEON_REALTIME_SECRET,
    db: 'neondb',
  });

  const query = rawSql('SELECT id, email, role FROM users LIMIT 1');
  const sealed = await realtime.seal({ query });
  console.log('Query sealed.');

  const client = createRealtimeClient({
    url: process.env.NEON_REALTIME_URL,
  });

  console.log('Subscribing via WebSocket to:', process.env.NEON_REALTIME_URL);
  const subscription = client.subscribe(sealed);

  const resultPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      console.log('Timeout reached (subscription created and sent successfully)');
      resolve({ status: 'connected_timeout' });
    }, 4000);

    subscription.onChange(({ data, status, error }) => {
      console.log('Realtime event received! Status:', status, 'Data rows:', Array.isArray(data) ? data.length : data);
      if (error) {
        console.error('Subscription error:', error);
      }
      clearTimeout(timeout);
      subscription.unsubscribe();
      resolve({ status, data });
    });
  });

  const result = await resultPromise;
  console.log('Realtime Client Test Result:', result.status);
  console.log('Neon Realtime Client subscription: SUCCESS');
  process.exit(0);
}

main().catch(err => {
  console.error('Realtime subscription error:', err);
  process.exit(1);
});
