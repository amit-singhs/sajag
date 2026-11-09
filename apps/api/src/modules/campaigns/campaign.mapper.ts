import { randomInt } from 'node:crypto';
import type { Campaign, CampaignInput, CampaignSummary, PublicCampaign, PublicQuestion, Question } from '@sajag/shared';
import type { CampaignDocument } from '../../db/mongo';
import { toIso } from '../../lib/dates';

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

export function toCampaignInput(doc: CampaignDocument): CampaignInput {
  const { title, summary, organizer, tags, settings, dataPolicy, questions } = doc;
  return { title, summary, organizer, tags, settings, dataPolicy, questions };
}

export function toCampaign(doc: CampaignDocument): Campaign {
  return {
    ...toCampaignInput(doc),
    id: doc._id.toHexString(),
    slug: doc.slug,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    publishedAt: toIso(doc.publishedAt),
  };
}

export function toSummary(doc: CampaignDocument): CampaignSummary {
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    organizer: doc.organizer,
    tags: doc.tags,
    status: doc.status,
    questionCount: doc.questions.length,
    updatedAt: doc.updatedAt.toISOString(),
    publishedAt: toIso(doc.publishedAt),
  };
}

function toPublicQuestion(q: Question): PublicQuestion {
  if (q.type === 'text') {
    return { id: q.id, type: q.type, text: q.text, topic: q.topic, required: q.required, points: 0, options: [] };
  }
  const options = q.options.map(({ id, text }) => ({ id, text }));
  const shuffle = q.type !== 'true_false' && q.shuffleOptions;
  return {
    id: q.id,
    type: q.type,
    text: q.text,
    topic: q.topic,
    required: q.required,
    points: q.points,
    options: shuffle ? shuffled(options) : options,
  };
}

/** What participants see. Never includes correct answers or explanations. */
export function toPublicCampaign(doc: CampaignDocument): PublicCampaign {
  const questions = doc.settings.shuffleQuestions ? shuffled(doc.questions) : doc.questions;
  const { startsAt, endsAt, language, onePerMobile } = doc.settings;
  return {
    id: doc._id.toHexString(),
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    organizer: doc.organizer,
    tags: doc.tags,
    questionCount: doc.questions.length,
    settings: { startsAt, endsAt, language, onePerMobile },
    dataPolicy: doc.dataPolicy,
    questions: questions.map(toPublicQuestion),
  };
}
