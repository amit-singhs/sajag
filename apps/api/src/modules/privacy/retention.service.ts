import { prisma } from '../../db/prisma';
import { DAY_MS } from '../../lib/dates';
import { logger } from '../../lib/logger';
import { eraseParticipants } from './erasure.service';

export interface RetentionReport {
  erased: number;
  purgedOtps: number;
}

/** Idempotent retention pass: erase personal data past its retention date, purge stale OTP challenges. */
export async function runRetention(now = new Date()): Promise<RetentionReport> {
  const erased = await eraseParticipants({ scheduledErasureAt: { lte: now } }, 'retention_expired');
  const { count: purgedOtps } = await prisma.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - DAY_MS) } } });
  const report = { erased, purgedOtps };
  logger.info(report, 'Retention pass finished');
  return report;
}

const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;
const INTERVAL_MS = DAY_MS;

/**
 * In-process daily schedule (Render's free plan has no cron jobs). Safe across restarts because every
 * step is idempotent; the keep-alive pinger keeps the instance running so the timer fires.
 */
export function scheduleRetention(): void {
  const run = () =>
    void runRetention().catch((error: unknown) => {
      logger.error({ err: error }, 'Retention pass failed — will retry on the next schedule');
    });
  setTimeout(run, FIRST_RUN_DELAY_MS).unref();
  setInterval(run, INTERVAL_MS).unref();
}
