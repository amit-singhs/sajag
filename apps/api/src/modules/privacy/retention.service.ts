import { prisma } from '../../db/prisma';
import { decrypt } from '../../lib/crypto';
import { DAY_MS } from '../../lib/dates';
import { logger } from '../../lib/logger';
import { smsProvider } from '../otp/sms';
import { eraseParticipants } from './erasure.service';

const NOTICE_WINDOW_MS = 2 * DAY_MS;

export interface RetentionReport {
  noticed: number;
  erased: number;
  purgedOtps: number;
}

/** Sends the 48-hour advance notice before erasure (DPDP Rules, rule 8). */
async function sendErasureNotices(now: Date): Promise<number> {
  const due = await prisma.participant.findMany({
    where: {
      erasedAt: null,
      erasureNoticeSentAt: null,
      mobileEnc: { not: null },
      scheduledErasureAt: { lte: new Date(now.getTime() + NOTICE_WINDOW_MS), gt: now },
    },
    select: { id: true, mobileEnc: true, scheduledErasureAt: true },
    take: 1000,
  });
  let sent = 0;
  for (const p of due) {
    if (!p.mobileEnc || !p.scheduledErasureAt) continue;
    try {
      await smsProvider.sendErasureNotice(decrypt(p.mobileEnc), p.scheduledErasureAt);
      await prisma.participant.update({ where: { id: p.id }, data: { erasureNoticeSentAt: now } });
      sent++;
    } catch (error) {
      logger.error({ err: error, participantId: p.id }, 'Failed to send erasure notice');
    }
  }
  return sent;
}

/** Idempotent retention pass: notices, erasure of expired data, purge of stale OTP challenges. */
export async function runRetention(now = new Date()): Promise<RetentionReport> {
  const noticed = await sendErasureNotices(now);
  const erased = await eraseParticipants({ scheduledErasureAt: { lte: now } }, 'retention_expired');
  const { count: purgedOtps } = await prisma.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - DAY_MS) } } });
  const report = { noticed, erased, purgedOtps };
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
