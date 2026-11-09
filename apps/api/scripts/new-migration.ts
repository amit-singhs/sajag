/**
 * Generates a SQL migration from the difference between the live Azure SQL schema and prisma/schema.prisma.
 * Usage: npm run db:migration -- add_feature_x
 * Commit the generated folder; Render's build applies it via `prisma migrate deploy`.
 * (Uses --from-url, so no shadow database is needed on Azure SQL.)
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const name = (process.argv[2] ?? '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '');
if (!name) {
  console.error('Usage: npm run db:migration -- <migration_name>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (expected in the repository root .env)');
  process.exit(1);
}

const sql = execFileSync(
  'npx',
  ['prisma', 'migrate', 'diff', '--from-url', process.env.DATABASE_URL, '--to-schema-datamodel', 'prisma/schema.prisma', '--script'],
  { encoding: 'utf8' },
);

if (!sql.trim() || /This is an empty migration/i.test(sql)) {
  console.log('Schema is already in sync with the database — no migration created.');
  process.exit(0);
}

if (sql.includes('_prisma_migrations')) {
  console.error('Generated SQL touches Prisma’s migration ledger — aborting. Inspect the schema drift manually.');
  process.exit(1);
}

const stamp =new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const dir = join('prisma', 'migrations', `${stamp}_${name}`);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'migration.sql'), sql);
console.log(`Created ${dir}/migration.sql — review it, then commit.`);
