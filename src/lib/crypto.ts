import crypto from 'crypto';

// 32-byte key for AES-256-GCM
function getEncryptionKey(): Buffer {
  const hexOrBase64 = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  if (hexOrBase64.length === 64) {
    return Buffer.from(hexOrBase64, 'hex');
  }
  return Buffer.alloc(32, hexOrBase64);
}

/**
 * Encrypt a string using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex encoded)
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a string using AES-256-GCM.
 */
export function decryptSecret(encryptedString: string): string {
  if (!encryptedString) return '';
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted secret format. Expected iv:authTag:ciphertext.');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Sign an installation manifest or request payload using HMAC-SHA256
 */
export function signPayload(payload: object | string, customSecret?: string): string {
  const secret = customSecret || process.env.DEPLOYMENT_SIGNING_KEY || 'earthin_manifest_signing_key_default';
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature with constant-time equality check
 */
export function verifyPayloadSignature(
  payload: object | string,
  providedSignature: string,
  customSecret?: string
): boolean {
  try {
    const expectedSignature = signPayload(payload, customSecret);
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure random password for MySQL
 * 20+ characters with uppercase, lowercase, numbers, and safe symbols
 */
export function generateSecurePassword(length = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#%*+,-./:;=?@^_';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

/**
 * Generate a random UUID
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}
