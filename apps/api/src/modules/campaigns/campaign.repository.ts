import { ObjectId, type Filter } from 'mongodb';
import type { CampaignStatus } from '@sajag/shared';
import { collections, type CampaignDocument } from '../../db/mongo';

type CampaignPatch = Partial<Omit<CampaignDocument, '_id' | 'createdAt' | 'createdBy' | 'slug'>>;

const toObjectId = (id: string): ObjectId | null => (ObjectId.isValid(id) ? new ObjectId(id) : null);

/** Data-access for campaign (form) documents in Azure DocumentDB. */
export const campaignRepository = {
  async findById(id: string): Promise<CampaignDocument | null> {
    const _id = toObjectId(id);
    if (!_id) return null;
    return (await collections()).campaigns.findOne({ _id });
  },

  async findBySlug(slug: string): Promise<CampaignDocument | null> {
    return (await collections()).campaigns.findOne({ slug });
  },

  async findManyByIds(ids: readonly string[]): Promise<CampaignDocument[]> {
    const objectIds = ids.map(toObjectId).filter((v): v is ObjectId => v !== null);
    if (objectIds.length === 0) return [];
    return (await collections()).campaigns.find({ _id: { $in: objectIds } }).toArray();
  },

  async list(status?: CampaignStatus): Promise<CampaignDocument[]> {
    const filter: Filter<CampaignDocument> = status ? { status } : {};
    return (await collections()).campaigns.find(filter).sort({ updatedAt: -1 }).limit(500).toArray();
  },

  async slugExists(slug: string): Promise<boolean> {
    return (await (await collections()).campaigns.countDocuments({ slug }, { limit: 1 })) > 0;
  },

  async insert(doc: CampaignDocument): Promise<CampaignDocument> {
    await (await collections()).campaigns.insertOne(doc);
    return doc;
  },

  async update(id: string, patch: CampaignPatch): Promise<CampaignDocument | null> {
    const _id = toObjectId(id);
    if (!_id) return null;
    return (await collections()).campaigns.findOneAndUpdate(
      { _id },
      { $set: { ...patch, updatedAt: new Date() } },
      { returnDocument: 'after' },
    );
  },
};
