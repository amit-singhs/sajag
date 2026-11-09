import { ObjectId } from 'mongodb';
import type { Campaign, CampaignInput, CampaignStatus, CampaignSummary, PublicCampaign } from '@sajag/shared';
import type { CampaignDocument } from '../../db/mongo';
import { prisma } from '../../db/prisma';
import { randomSlug } from '../../lib/crypto';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';
import { toCampaign, toPublicCampaign, toSummary } from './campaign.mapper';
import { campaignRepository } from './campaign.repository';

function isWithinWindow(doc: CampaignDocument, now = new Date()): boolean {
  const { startsAt, endsAt } = doc.settings;
  return (!startsAt || new Date(startsAt) <= now) && (!endsAt || new Date(endsAt) > now);
}

async function uniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = randomSlug();
    if (!(await campaignRepository.slugExists(slug))) return slug;
  }
  throw new Error('Could not allocate a unique campaign slug');
}

async function requireCampaign(id: string): Promise<CampaignDocument> {
  const doc = await campaignRepository.findById(id);
  if (!doc) throw Errors.notFound('Campaign');
  return doc;
}

const submissionCount = (campaignId: string) => prisma.submission.count({ where: { campaignId } });

export const campaignService = {
  requireCampaign,

  async listForAdmin(): Promise<CampaignSummary[]> {
    return (await campaignRepository.list()).map(toSummary);
  },

  async getForAdmin(id: string): Promise<Campaign> {
    return toCampaign(await requireCampaign(id));
  },

  async create(input: CampaignInput, actorId: string): Promise<Campaign> {
    const now = new Date();
    const doc = await campaignRepository.insert({
      ...input,
      _id: new ObjectId(),
      slug: await uniqueSlug(),
      status: 'draft',
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });
    await recordAudit({ actorId, action: 'campaign.create', entity: 'campaign', entityId: doc._id.toHexString() });
    return toCampaign(doc);
  },

  async update(id: string, input: CampaignInput, actorId: string): Promise<Campaign> {
    const existing = await requireCampaign(id);
    const questionsChanged = JSON.stringify(existing.questions) !== JSON.stringify(input.questions);
    if (questionsChanged && (await submissionCount(id)) > 0) {
      throw Errors.conflict('Questions are locked once responses exist. Duplicate the campaign to change them.');
    }
    const updated = await campaignRepository.update(id, input);
    if (!updated) throw Errors.notFound('Campaign');
    await recordAudit({ actorId, action: 'campaign.update', entity: 'campaign', entityId: id, meta: { questionsChanged } });
    return toCampaign(updated);
  },

  async setStatus(id: string, status: CampaignStatus, actorId: string): Promise<Campaign> {
    const existing = await requireCampaign(id);
    if (status === 'draft' && (await submissionCount(id)) > 0) {
      throw Errors.conflict('A campaign with responses cannot return to draft. Close it instead.');
    }
    const publishedAt = status === 'live' ? (existing.publishedAt ?? new Date()) : existing.publishedAt;
    const updated = await campaignRepository.update(id, { status, publishedAt });
    if (!updated) throw Errors.notFound('Campaign');
    await recordAudit({ actorId, action: `campaign.${status}`, entity: 'campaign', entityId: id });
    return toCampaign(updated);
  },

  async listLive(): Promise<CampaignSummary[]> {
    return (await campaignRepository.list('live')).filter((doc) => isWithinWindow(doc)).map(toSummary);
  },

  /** A campaign that is accepting responses right now, or a clear error explaining why not. */
  async requireOpenBySlug(slug: string): Promise<CampaignDocument> {
    const doc = await campaignRepository.findBySlug(slug);
    if (!doc || doc.status === 'draft') throw Errors.notFound('Campaign');
    if (doc.status === 'closed' || !isWithinWindow(doc)) throw Errors.gone('This campaign is not accepting responses');
    return doc;
  },

  async getPublic(slug: string): Promise<PublicCampaign> {
    return toPublicCampaign(await this.requireOpenBySlug(slug));
  },
};
