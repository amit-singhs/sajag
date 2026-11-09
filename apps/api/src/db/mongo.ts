import { MongoClient, type Collection, type Db, type ObjectId } from 'mongodb';
import type { CampaignInput, CampaignStatus } from '@sajag/shared';
import { env } from '../config/env';

/** Stored shape of a campaign (form) document in Azure DocumentDB. */
export interface CampaignDocument extends CampaignInput {
  _id: ObjectId;
  slug: string;
  status: CampaignStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface MigrationRecord {
  _id: string;
  appliedAt: Date;
}

export interface Collections {
  campaigns: Collection<CampaignDocument>;
  migrations: Collection<MigrationRecord>;
}

// Azure DocumentDB (vCore) does not support retryable writes.
const client = new MongoClient(env.MONGODB_URI, {
  retryWrites: false,
  appName: 'sajag-api',
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
});
let connected: Promise<Db> | null = null;

/** Lazily connects; a failed attempt is forgotten so the next call retries instead of caching the failure. */
export function connectMongo(): Promise<Db> {
  connected ??= client
    .connect()
    .then((c) => c.db(env.MONGODB_DB))
    .catch((error: unknown) => {
      connected = null;
      throw error;
    });
  return connected;
}

/** Host:port of the document store (no credentials) — for diagnostics only. */
export function mongoHost(): string {
  try {
    const url = new URL(env.MONGODB_URI);
    return `${url.hostname}:${url.port || (url.protocol === 'mongodb+srv:' ? 'SRV' : '27017')}`;
  } catch {
    return 'unparseable MONGODB_URI';
  }
}

export async function collections(): Promise<Collections> {
  const db = await connectMongo();
  return {
    campaigns: db.collection<CampaignDocument>('campaigns'),
    migrations: db.collection<MigrationRecord>('_migrations'),
  };
}

export async function closeMongo(): Promise<void> {
  if (connected) await client.close();
  connected = null;
}
