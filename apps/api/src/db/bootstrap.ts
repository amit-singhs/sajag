import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { collections } from './mongo';
import { prisma } from './prisma';
import { SAMPLE_CAMPAIGN_SLUG, sampleCampaign } from './seed/sample-campaign';

export const BCRYPT_ROUNDS = 12;

/** Idempotent: creates the first owner account from env if no admin exists yet. */
export async function ensureFirstAdmin(): Promise<void> {
  if ((await prisma.adminUser.count()) > 0) return;
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    logger.warn('No admin exists and ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD are not set — skipping admin bootstrap');
    return;
  }
  await prisma.adminUser.create({
    data: {
      email: env.ADMIN_SEED_EMAIL.toLowerCase(),
      name: env.ADMIN_SEED_NAME,
      role: 'owner',
      passwordHash: await bcrypt.hash(env.ADMIN_SEED_PASSWORD, BCRYPT_ROUNDS),
    },
  });
  logger.info('Created first owner admin from ADMIN_SEED_* variables');
}

/** Idempotent: publishes campaign 01 (the original form) on a fresh database. */
export async function ensureSampleCampaign(): Promise<void> {
  if (!env.SEED_SAMPLE_CAMPAIGN) return;
  const { campaigns } = await collections();
  if ((await campaigns.countDocuments({}, { limit: 1 })) > 0) return;
  const now = new Date();
  await campaigns.insertOne({
    ...sampleCampaign,
    _id: new ObjectId(),
    slug: SAMPLE_CAMPAIGN_SLUG,
    status: 'live',
    createdBy: 'system',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
  });
  logger.info('Seeded sample campaign 01');
}
