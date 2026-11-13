import { Pool } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createRealtime, rawSql } from '@neon/realtime/server';

console.log('====================================================');
console.log(' EARTHIN WEBSITE FACTORY — NEON SERVICES VERIFIER   ');
console.log('====================================================');

async function verifyPostgres() {
  console.log('\n[1/3] Verifying Neon PostgreSQL...');
  console.log('  Database URL (Pooler):', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
  console.log('  Database URL (Unpooled):', process.env.DATABASE_URL_UNPOOLED?.replace(/:[^:@]+@/, ':***@'));
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const resUsers = await client.query('SELECT id, name, email, status FROM users');
    console.log(`  ✓ Query succeeded. Users count: ${resUsers.rows.length}`);
    if (resUsers.rows.length > 0) {
      console.log(`  ✓ Sample user: ${resUsers.rows[0].name} (${resUsers.rows[0].email}) - status: ${resUsers.rows[0].status}`);
    }

    const resRoles = await client.query('SELECT name FROM roles');
    console.log(`  ✓ Roles count: ${resRoles.rows.length} (${resRoles.rows.map(r => r.name).join(', ')})`);

    const resReleases = await client.query('SELECT version, name FROM cms_releases');
    console.log(`  ✓ CMS Releases: ${resReleases.rows.map(r => `${r.name} (${r.version})`).join(', ')}`);

    const resPlugins = await client.query('SELECT COUNT(*)::int as count FROM cms_plugins');
    console.log(`  ✓ CMS Plugins count: ${resPlugins.rows[0].count}`);

    const resThemes = await client.query('SELECT COUNT(*)::int as count FROM cms_themes');
    console.log(`  ✓ CMS Themes count: ${resThemes.rows[0].count}`);
  } finally {
    client.release();
  }

  return true;
}

async function verifyObjectStorage() {
  console.log('\n[2/3] Verifying Neon Object Storage (S3 API)...');
  console.log('  Endpoint:', process.env.AWS_ENDPOINT_URL_S3);
  console.log('  Region:', process.env.AWS_REGION);
  console.log('  Bucket: assets');

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  const testKey = `verification/${Date.now()}-e2e-check.txt`;
  const testPayload = `Earthin Website Factory E2E Verification - Timestamp ${new Date().toISOString()}`;

  console.log(`  → Uploading test file "${testKey}"...`);
  const putRes = await s3.send(new PutObjectCommand({
    Bucket: 'assets',
    Key: testKey,
    Body: testPayload,
    ContentType: 'text/plain',
  }));
  console.log(`  ✓ Upload successful: HTTP ${putRes.$metadata.httpStatusCode}`);

  console.log(`  → Downloading back "${testKey}"...`);
  const getRes = await s3.send(new GetObjectCommand({
    Bucket: 'assets',
    Key: testKey,
  }));
  const content = await getRes.Body.transformToString();
  if (content !== testPayload) {
    throw new Error('Downloaded content did not match uploaded payload!');
  }
  console.log('  ✓ Data integrity verified (exact match).');

  console.log(`  → Cleaning up "${testKey}"...`);
  await s3.send(new DeleteObjectCommand({
    Bucket: 'assets',
    Key: testKey,
  }));
  console.log('  ✓ Cleanup successful.');

  return true;
}

async function verifyRealtime() {
  console.log('\n[3/3] Verifying Neon Realtime...');
  console.log('  WebSocket URL:', process.env.NEON_REALTIME_URL);

  const realtime = createRealtime({
    secret: process.env.NEON_REALTIME_SECRET,
    db: 'neondb',
  });

  console.log('  → Generating sealed live query for "users"...');
  const query = rawSql('SELECT id, name, email, status FROM users LIMIT 1');
  const sealed = await realtime.seal({ query });
  console.log('  ✓ Query successfully sealed with cryptographic capability token.');
  console.log('  ✓ Sealed Query Token (sample):', JSON.stringify(sealed).substring(0, 60) + '...');

  return true;
}

async function main() {
  try {
    await verifyPostgres();
    await verifyObjectStorage();
    await verifyRealtime();

    console.log('\n====================================================');
    console.log(' ALL 3 NEON SERVICES VERIFIED END-TO-END (PASS)');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed:', err);
    process.exit(1);
  }
}

main();
