import { MongoServerSelectionError } from 'mongodb';
import { createApp } from './app';
import { env } from './config/env';
import { ensureFirstAdmin, ensureSampleCampaign } from './db/bootstrap';
import { closeMongo, connectMongo, mongoHost } from './db/mongo';
import { runMongoMigrations } from './db/mongo-migrations';
import { prisma } from './db/prisma';
import { scheduleRetention } from './modules/privacy/retention.service';
import { logger } from './lib/logger';

const RETRY_MS = 30_000;

/** Document-store setup runs in the background and retries, so the API stays up while DocumentDB is unreachable. */
async function initDocumentStore(): Promise<void> {
  try {
    const db = await connectMongo();
    await runMongoMigrations(db);
    await ensureSampleCampaign();
    logger.info('Document store connected');
  } catch (error) {
    const unreachable = error instanceof MongoServerSelectionError;
    logger.error(
      unreachable
        ? `Cannot reach Azure DocumentDB at ${mongoHost()}. Check the cluster's Networking → firewall rules allow this machine's public IP, ` +
            `and that outbound port 10260 is not blocked by your network. Retrying in ${RETRY_MS / 1000}s.`
        : `Document store setup failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${RETRY_MS / 1000}s.`,
    );
    setTimeout(() => void initDocumentStore(), RETRY_MS).unref();
  }
}

async function start(): Promise<void> {
  await prisma.$connect();
  await ensureFirstAdmin();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });
  void initDocumentStore();
  scheduleRetention();

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      void Promise.allSettled([closeMongo(), prisma.$disconnect()]).then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'API failed to start');
  process.exit(1);
});
