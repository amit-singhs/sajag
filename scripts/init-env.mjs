#!/usr/bin/env node
/**
 * One-time local setup: creates the root .env from .env.example with freshly generated secrets.
 * Usage: npm run setup:env   (refuses to overwrite an existing .env)
 */
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const target = new URL('../.env', import.meta.url);
if (existsSync(target)) {
  console.error('.env already exists — leaving it untouched.');
  process.exit(1);
}

let text = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const set = (key, value) => {
  text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
};

const adminPassword = randomBytes(15).toString('base64url');
set('JWT_SECRET', randomBytes(32).toString('hex'));
set('DATA_ENCRYPTION_KEY', randomBytes(32).toString('base64'));
set('HASH_PEPPER', randomBytes(32).toString('hex'));
set('ADMIN_SEED_EMAIL', 'admin@sajag.local');
set('ADMIN_SEED_PASSWORD', adminPassword);

writeFileSync(target, text, { mode: 0o600 });
console.log('Created .env with new secrets.');
console.log(`First admin login → admin@sajag.local / ${adminPassword}`);
console.log('Now fill DATABASE_URL (Azure SQL) and MONGODB_URI (Azure DocumentDB) in .env.');
