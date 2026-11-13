import test from 'node:test';
import assert from 'node:assert/strict';

test('cPanel URL normalization logic', () => {
  const sanitizeUrl = (rawUrl) => {
    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    if (!url.match(/:\d+$/)) {
      url = `${url}:2083`;
    }
    return url;
  };

  assert.equal(sanitizeUrl('cpanel.earthin.online'), 'https://cpanel.earthin.online:2083');
  assert.equal(sanitizeUrl('https://123.45.67.89:2083/'), 'https://123.45.67.89:2083');
  assert.equal(sanitizeUrl('http://myhost.com'), 'http://myhost.com:2083');
});

test('cPanel database naming prefix rules', () => {
  const cpanelUser = 'earthin';
  const siteSlug = 'samachar';
  const randomSuffix = 'a1b2c3';

  const baseDbName = `${siteSlug.slice(0, 8)}_${randomSuffix}`;
  const baseDbUser = `u_${randomSuffix}`;

  const prefixedDbName = `${cpanelUser}_${baseDbName}`;
  const prefixedDbUser = `${cpanelUser}_${baseDbUser}`;

  assert.equal(prefixedDbName.startsWith('earthin_'), true);
  assert.equal(prefixedDbUser.startsWith('earthin_'), true);
  assert.ok(prefixedDbName.length <= 64, 'cPanel database name must not exceed 64 characters');
  assert.ok(prefixedDbUser.length <= 32, 'cPanel database user must not exceed 32 characters');
});
