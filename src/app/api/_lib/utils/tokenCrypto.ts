import crypto from 'node:crypto';
import { ApiError } from './response';

/**
 * AES-256-GCM at-rest encryption for third-party OAuth tokens (connector access/refresh
 * tokens). Nothing else in this backend needed symmetric encryption before this - JWTs and
 * webhook signatures only needed signing/hashing, not reversible encryption.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function encryptionKey(): Buffer {
  const value = process.env.CONNECTOR_TOKEN_ENCRYPTION_KEY;
  if (!value) {
    throw ApiError.internal(
      'Connector token encryption is not configured.',
      'TOKEN_ENCRYPTION_NOT_CONFIGURED'
    );
  }
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw ApiError.internal(
      'CONNECTOR_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.',
      'TOKEN_ENCRYPTION_MISCONFIGURED'
    );
  }
  return key;
}

/** Encrypts `plain` (an OAuth access/refresh token). Output: base64(iv).base64(authTag).base64(ciphertext). */
export function encryptToken(plain: string): string {
  const key = encryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

/** Reverses [[encryptToken]]. Throws ApiError.internal (never leaks cause) if the value is malformed. */
export function decryptToken(encoded: string): string {
  const key = encryptionKey();
  const parts = encoded.split('.');
  if (parts.length !== 3) {
    throw ApiError.internal('Stored connector token is corrupted.', 'TOKEN_DECRYPTION_FAILED');
  }
  const [ivB64, authTagB64, ciphertextB64] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch {
    throw ApiError.internal('Stored connector token is corrupted.', 'TOKEN_DECRYPTION_FAILED');
  }
}

/** Generates a fresh base64-encoded 32-byte key - for the operator to put in Vercel env config. */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
