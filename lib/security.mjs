import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const token = () => randomBytes(32).toString('hex');
export const digest = value => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw Object.assign(new Error('Use a password between 12 and 256 characters.'), { status: 400 });
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 256 || !stored) return false;
  const [salt, hex] = stored.split(':');
  const key = await scrypt(password, salt, 64); const saved = Buffer.from(hex, 'hex');
  return saved.length === key.length && timingSafeEqual(saved, key);
}
export function limiter(max, duration) {
  const map = new Map();
  return key => { const now = Date.now(); if (map.size > 5000) for (const [k,v] of map) if (v.until < now) map.delete(k); let entry = map.get(key); if (!entry || entry.until < now) { entry = { count: 0, until: now + duration }; map.set(key, entry); } return ++entry.count <= max; };
}
