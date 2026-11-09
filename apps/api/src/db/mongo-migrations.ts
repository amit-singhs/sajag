import type { Db } from 'mongodb';
import { logger } from '../lib/logger';
import { collections } from './mongo';

/**
 * Versioned, append-only migrations for the document store (indexes, backfills, renames).
 * Add a new entry at the end whenever the campaign document shape or its query patterns change;
 * `npm run db:deploy` (run on every Render build) applies pending ones and records them in `_migrations`.
 */
interface MongoMigration {
  id: string;
  up: (db: Db) => Promise<void>;
}

const migrations: readonly MongoMigration[] = [
  {
    id: '0001_campaign_indexes',
    up: async (db) => {
      const campaigns = db.collection('campaigns');
      await campaigns.createIndex({ slug: 1 }, { unique: true, name: 'slug_unique' });
      await campaigns.createIndex({ status: 1, updatedAt: -1 }, { name: 'status_updated' });
    },
  },
  {
    // Guardian OTP is deferred: campaigns that allow minors now take a declared (unverified) guardian consent.
    id: '0002_guardian_declaration',
    up: async (db) => {
      await db
        .collection('campaigns')
        .updateMany({ 'dataPolicy.minors': 'guardian' }, { $set: { 'dataPolicy.guardianMethods': ['declaration'] } });
    },
  },
  {
    // Correct spelling of the campaign director's surname.
    id: '0003_organizer_name_fix',
    up: async (db) => {
      await db.collection('campaigns').updateMany({ organizer: 'संजय डामी' }, { $set: { organizer: 'संजय डाबी' } });
    },
  },
];

export async function runMongoMigrations(db: Db): Promise<string[]> {
  const { migrations: ledger } = await collections();
  const applied = new Set((await ledger.find({}, { projection: { _id: 1 } }).toArray()).map((m) => m._id));
  const ran: string[] = [];
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    logger.info({ migration: migration.id }, 'Applying document-store migration');
    await migration.up(db);
    await ledger.insertOne({ _id: migration.id, appliedAt: new Date() });
    ran.push(migration.id);
  }
  return ran;
}
