async function testMiddleware() {
  const BASE = process.env.TEST_URL || 'http://127.0.0.1:3000';

  console.log('Testing Authentication Middleware...\n');

  // Case 1: Unauthenticated visit to dashboard /
  const r1 = await fetch(BASE + '/', { redirect: 'manual' });
  console.log('1. Unauthenticated GET /:');
  console.log('   Status:', r1.status);
  console.log('   Redirect Target:', r1.headers.get('location'));

  // Case 2: Unauthenticated visit to /websites
  const r2 = await fetch(BASE + '/websites', { redirect: 'manual' });
  console.log('\n2. Unauthenticated GET /websites:');
  console.log('   Status:', r2.status);
  console.log('   Redirect Target:', r2.headers.get('location'));

  // Case 3: Public /login page
  const r3 = await fetch(BASE + '/login', { redirect: 'manual' });
  console.log('\n3. Unauthenticated GET /login:');
  console.log('   Status:', r3.status, '(200 means page loaded correctly)');

  // Case 4: Authenticated user visits dashboard
  const loginRes = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@earthin.online', password: 'EarthinAdmin2026!' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('\n4. Login request: status', loginRes.status, '- Session cookie set:', Boolean(cookie));

  const r4 = await fetch(BASE + '/', {
    headers: { Cookie: cookie || '' },
    redirect: 'manual',
  });
  console.log('   Authenticated GET / status:', r4.status, '(200 means access granted)');

  // Case 5: Authenticated user visits /login (should redirect to dashboard /)
  const r5 = await fetch(BASE + '/login', {
    headers: { Cookie: cookie || '' },
    redirect: 'manual',
  });
  console.log('\n5. Authenticated GET /login:');
  console.log('   Status:', r5.status);
  console.log('   Redirect Target:', r5.headers.get('location'), '(Redirected to /)');
}

testMiddleware().catch(console.error);
