/**
 * Runs a command with the repository-root .env loaded and DATABASE_URL normalised for Prisma.
 * Used by every API script so the Prisma CLI and the app see the same connection string.
 * Usage: tsx scripts/with-env.ts <command...>
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeDatabaseUrl } from '../src/config/database-url';

const envFile = resolve(import.meta.dirname, '../../../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);
if (process.env.DATABASE_URL) process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);

const command = process.argv.slice(2).join(' ');
if (!command) {
  console.error('Usage: tsx scripts/with-env.ts <command>');
  process.exit(1);
}

const child = spawn(command, { stdio: 'inherit', shell: true, env: process.env });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
