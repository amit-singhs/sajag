/**
 * Manual / one-off retention run: `npm run jobs:retention`.
 * In production the same pass runs daily inside the API (see modules/privacy/retention.service.ts).
 */
import { closeMongo } from '../db/mongo';
import { prisma } from '../db/prisma';
import { logger } from '../lib/logger';
import { runRetention } from '../modules/privacy/retention.service';

runRetention()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Retention job failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([prisma.$disconnect(), closeMongo()]);
  });
