import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Setup environment keys for test
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.DEPLOYMENT_SIGNING_KEY = 'earthin_test_secret_manifest_key';

function getEncryptionKey() {
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
}

function encryptSecret(plainText) {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSecret(encryptedString) {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Malformed format');
  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

function signPayload(payload, customSecret) {
  const secret = customSecret || process.env.DEPLOYMENT_SIGNING_KEY;
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function verifyPayloadSignature(payload, providedSignature, customSecret) {
  try {
    const expectedSignature = signPayload(payload, customSecret);
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
  } catch {
    return false;
  }
}

test('AES-256-GCM encryption and decryption round-trip', () => {
  const secretToken = 'cpanel_api_token_earthin_secret_123456!@#';
  const encrypted = encryptSecret(secretToken);
  assert.notEqual(encrypted, secretToken);
  assert.equal(encrypted.split(':').length, 3, 'Must contain iv, authTag, and ciphertext');

  const decrypted = decryptSecret(encrypted);
  assert.equal(decrypted, secretToken, 'Decrypted text must match original plain text');
});

test('HMAC-SHA256 deployment manifest signing and verification', () => {
  const manifest = {
    installId: 'uuid-12345',
    timestamp: 1700000000,
    domain: 'samachar.earthin.online',
    dbName: 'earthin_samachar_db',
  };

  const signature = signPayload(manifest);
  assert.equal(signature.length, 64, 'SHA-256 hex digest must be 64 characters');

  const isValid = verifyPayloadSignature(manifest, signature);
  assert.equal(isValid, true, 'Valid signature must verify successfully');

  // Tamper payload
  const tamperedManifest = { ...manifest, domain: 'hacker.com' };
  const isTamperedValid = verifyPayloadSignature(tamperedManifest, signature);
  assert.equal(isTamperedValid, false, 'Tampered payload must fail verification');

  // Wrong secret
  const isWrongSecretValid = verifyPayloadSignature(manifest, signature, 'wrong_key');
  assert.equal(isWrongSecretValid, false, 'Signature with wrong key must fail verification');
});

