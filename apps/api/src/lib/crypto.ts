import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const key = Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64');

/** Encrypts personal data at rest. Output: base64(iv | authTag | ciphertext). */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

export function decrypt(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}

/** Keyed, deterministic hash: lets us find a person by mobile without storing it in clear text. */
export function keyedHash(value: string): string {
  return createHmac('sha256', env.HASH_PEPPER).update(value).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function numericCode(digits = 6): string {
  return Array.from({ length: digits }, () => randomInt(0, 10)).join('');
}

const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function randomSlug(length = 8): string {
  return Array.from({ length }, () => SLUG_ALPHABET[randomInt(0, SLUG_ALPHABET.length)]).join('');
}
