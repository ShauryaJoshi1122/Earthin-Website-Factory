async function run() {
  console.log('====================================================');
  console.log(' RUNNING END-TO-END HTTP TESTS ON LIVE APP (PORT 3000)');
  console.log('====================================================\n');

  const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

  // 1. Test GET /api/neon/verify (Tests Postgres, Object Storage, and Realtime internally)
  console.log('[Test 1] Testing GET /api/neon/verify...');
  const verifyRes = await fetch(`${BASE_URL}/api/neon/verify`);
  const verifyData = await verifyRes.json();
  console.log('Status code:', verifyRes.status);
  console.log('Verification output:', JSON.stringify(verifyData, null, 2));
  if (!verifyData.success) {
    throw new Error('Neon services verification failed via API route!');
  }
  console.log('✓ PASS: All 3 Neon services verified through Next.js server runtime.\n');

  // 2. Test POST /api/auth/login (Authenticates against live Neon Postgres DB)
  console.log('[Test 2] Testing POST /api/auth/login with Super Admin credentials...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@earthin.online',
      password: 'EarthinAdmin2026!',
    }),
  });
  console.log('Status code:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Session Cookie received:', cookie ? 'YES (HttpOnly)' : 'NO');
  if (loginRes.status !== 200 || !loginData.user) {
    throw new Error('Login failed against live Neon database!');
  }
  console.log('✓ PASS: Live authentication against Neon Postgres succeeded.\n');

  // 3. Test GET /api/dashboard/stats (Authenticated fetch from live DB)
  console.log('[Test 3] Testing GET /api/dashboard/stats...');
  const statsRes = await fetch(`${BASE_URL}/api/dashboard/stats`, {
    headers: { Cookie: cookie || '' },
  });
  const statsData = await statsRes.json();
  console.log('Status code:', statsRes.status);
  console.log('Stats from Live Neon DB:', statsData);
  if (statsRes.status !== 200) {
    throw new Error('Failed to fetch dashboard stats!');
  }
  console.log('✓ PASS: Live dashboard stats retrieved successfully.\n');

  // 4. Test POST /api/realtime/seal (Realtime live query sealing)
  console.log('[Test 4] Testing POST /api/realtime/seal (Realtime live query sealing)...');
  const sealRes = await fetch(`${BASE_URL}/api/realtime/seal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie || '',
    },
    body: JSON.stringify({ topic: 'deployments' }),
  });
  const sealData = await sealRes.json();
  console.log('Status code:', sealRes.status);
  console.log('Sealed Query URL:', sealData.url);
  console.log('Sealed Token preview:', JSON.stringify(sealData.sealedQuery).substring(0, 50) + '...');
  if (sealRes.status !== 200 || !sealData.sealedQuery) {
    throw new Error('Failed to generate realtime sealed query!');
  }
  console.log('✓ PASS: Realtime sealed query generated successfully.\n');

  // 5. Test POST /api/upload (Upload asset directly to Neon Object Storage via HTTP API)
  console.log('[Test 5] Testing POST /api/upload (Direct upload to Neon Object Storage)...');
  const formData = new FormData();
  const fileBlob = new Blob(['PNG_TEST_CONTENT_FOR_EARTHIN_FACTORY'], { type: 'image/png' });
  formData.append('file', fileBlob, 'earthin-brand-logo.png');
  formData.append('folder', 'branding');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookie || '' },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('Status code:', uploadRes.status);
  console.log('Upload Result:', uploadData);
  if (uploadRes.status !== 200 || !uploadData.url) {
    throw new Error('Upload to Neon Object Storage failed!');
  }
  console.log('✓ PASS: Asset successfully uploaded to Neon Object Storage bucket "assets".\n');

  console.log('====================================================');
  console.log(' ALL END-TO-END TESTS PASSED ON LIVE RUNNING APP!   ');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\nE2E Test Failure:', err);
  process.exit(1);
});
