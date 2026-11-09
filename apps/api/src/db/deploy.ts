/**
 * Build-time schema deployment (run by `npm run db:deploy` on every Render build, after
 * `prisma migrate deploy` has applied SQL migrations):
 *   1. applies pending document-store migrations (indexes etc.)
 *   2. bootstraps the first admin and the sample campaign when the databases are empty
 */
import { logger } from '../lib/logger';
import { ensureFirstAdmin, ensureSampleCampaign } from './bootstrap';
import { closeMongo, connectMongo } from './mongo';
import { runMongoMigrations } from './mongo-migrations';
import { prisma } from './prisma';

async function main(): Promise<void> {
  const db = await connectMongo();
  const applied = await runMongoMigrations(db);
  logger.info({ applied }, applied.length ? 'Document-store migrations applied' : 'Document store is up to date');
  await ensureFirstAdmin();
  await ensureSampleCampaign();
}

main()
  .then(() => logger.info('Database deploy complete'))
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Database deploy failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([closeMongo(), prisma.$disconnect()]);
  });
