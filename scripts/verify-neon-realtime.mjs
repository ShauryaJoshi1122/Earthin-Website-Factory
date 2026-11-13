import { createRealtime, rawSql } from '@neon/realtime/server';

async function main() {
  console.log('--- Testing Neon Realtime ---');
  console.log('Realtime URL:', process.env.NEON_REALTIME_URL);

  if (!process.env.NEON_REALTIME_SECRET) {
    throw new Error('NEON_REALTIME_SECRET is not set');
  }

  try {
    const realtime = createRealtime({
      secret: process.env.NEON_REALTIME_SECRET,
      db: 'neondb',
    });

    console.log('Neon Realtime instance initialized successfully.');
    
    // Test sealing a query using rawSql
    const query = rawSql('SELECT id, email, role FROM users LIMIT 1');
    const sealed = await realtime.seal({ query });

    console.log('Sealed query generated successfully!');
    console.log('Sealed Query preview:', typeof sealed === 'string' ? `${sealed.substring(0, 40)}...` : JSON.stringify(sealed).substring(0, 40));
    console.log('Neon Realtime test: SUCCESS');
  } catch (err) {
    console.error('Neon Realtime test failed:', err);
    process.exit(1);
  }
}

main();
