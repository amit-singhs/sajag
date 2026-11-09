import { z } from 'zod';
import {
  CAMPAIGN_LANGUAGES,
  GUARDIAN_METHODS,
  MAX_RETENTION_DAYS,
  MINOR_POLICIES,
  MIN_RETENTION_DAYS,
  NOTICE_VERSION,
  RESULTS_VISIBILITY,
  SCORING_MODES,
  type CampaignStatus,
  type OptionalPersonalField,
  type QuestionType,
} from './constants';

const idSchema = z.string().trim().min(1).max(64);
const isoDateTime = z.string().datetime({ offset: true });

export const optionSchema = z.object({
  id: idSchema,
  text: z.string().trim().min(1, 'Option text is required').max(500),
  correct: z.boolean(),
});
export type QuestionOption = z.infer<typeof optionSchema>;

const questionBase = {
  id: idSchema,
  text: z.string().trim().min(3, 'Question text is required').max(1000),
  topic: z.string().trim().max(80),
  required: z.boolean(),
  explanation: z.string().trim().max(2000),
};
const points = z.number().int().min(0).max(100);
const choiceOptions = z.array(optionSchema).min(2).max(8);

const singleQuestion = z.object({
  ...questionBase,
  type: z.literal('single'),
  options: choiceOptions,
  points,
  shuffleOptions: z.boolean(),
});
const multiQuestion = z.object({
  ...questionBase,
  type: z.literal('multi'),
  options: choiceOptions,
  points,
  scoring: z.enum(SCORING_MODES),
  shuffleOptions: z.boolean(),
});
const trueFalseQuestion = z.object({
  ...questionBase,
  type: z.literal('true_false'),
  options: z.array(optionSchema).length(2),
  points,
});
const textQuestion = z.object({
  ...questionBase,
  type: z.literal('text'),
});

export const questionSchema = z
  .discriminatedUnion('type', [singleQuestion, multiQuestion, trueFalseQuestion, textQuestion])
  .superRefine((q, ctx) => {
    if (q.type === 'text') return;
    const correct = q.options.filter((o) => o.correct).length;
    const exactlyOne = q.type === 'single' || q.type === 'true_false';
    if (exactlyOne && correct !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Mark exactly one correct option' });
    }
    if (q.type === 'multi' && correct < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Mark at least one correct option' });
    }
    const ids = new Set(q.options.map((o) => o.id));
    if (ids.size !== q.options.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: 'Option ids must be unique' });
    }
  });
export type Question = z.infer<typeof questionSchema>;
export type ChoiceQuestion = Exclude<Question, { type: 'text' }>;

export function isChoiceQuestion(q: Question): q is ChoiceQuestion {
  return q.type !== 'text';
}

export const campaignSettingsSchema = z
  .object({
    startsAt: isoDateTime.nullable(),
    endsAt: isoDateTime.nullable(),
    onePerMobile: z.boolean(),
    resultsVisibility: z.enum(RESULTS_VISIBILITY),
    showExplanations: z.boolean(),
    shuffleQuestions: z.boolean(),
    language: z.enum(CAMPAIGN_LANGUAGES),
  })
  .refine((s) => !s.startsAt || !s.endsAt || s.startsAt < s.endsAt, {
    message: 'End date must be after start date',
    path: ['endsAt'],
  });
export type CampaignSettings = z.infer<typeof campaignSettingsSchema>;

export const fieldPolicySchema = z.object({
  collect: z.boolean(),
  required: z.boolean(),
  purpose: z.string().trim().max(200),
});
export type FieldPolicy = z.infer<typeof fieldPolicySchema>;

export const dataPolicySchema = z
  .object({
    fields: z.object({
      name: fieldPolicySchema,
      tehsil: fieldPolicySchema,
      district: fieldPolicySchema,
    }) satisfies z.ZodType<Record<OptionalPersonalField, FieldPolicy>>,
    minors: z.enum(MINOR_POLICIES),
    guardianMethods: z.array(z.enum(GUARDIAN_METHODS)).max(2),
    retentionDays: z.number().int().min(MIN_RETENTION_DAYS).max(MAX_RETENTION_DAYS),
    noticeVersion: z.string().trim().min(1).max(20),
  })
  .superRefine((p, ctx) => {
    for (const [key, field] of Object.entries(p.fields)) {
      if (field.collect && field.purpose.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', key, 'purpose'], message: 'State why this field is collected' });
      }
    }
    if (p.minors === 'guardian' && p.guardianMethods.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['guardianMethods'], message: 'Pick at least one guardian verification method' });
    }
  });
export type DataPolicy = z.infer<typeof dataPolicySchema>;

export const campaignInputSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().max(600),
    organizer: z.string().trim().max(120),
    tags: z.array(z.string().trim().min(1).max(40)).max(8),
    settings: campaignSettingsSchema,
    dataPolicy: dataPolicySchema,
    questions: z.array(questionSchema).min(1).max(100),
  })
  .refine((c) => new Set(c.questions.map((q) => q.id)).size === c.questions.length, {
    message: 'Question ids must be unique',
    path: ['questions'],
  });
export type CampaignInput = z.infer<typeof campaignInputSchema>;

export interface Campaign extends CampaignInput {
  id: string;
  slug: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface CampaignSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  organizer: string;
  tags: string[];
  status: CampaignStatus;
  questionCount: number;
  updatedAt: string;
  publishedAt: string | null;
}

/** Question as sent to participants — correct answers and explanations are never exposed before submission. */
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  text: string;
  topic: string;
  required: boolean;
  points: number;
  options: Array<{ id: string; text: string }>;
}

export interface PublicCampaign {
  id: string;
  slug: string;
  title: string;
  summary: string;
  organizer: string;
  tags: string[];
  questionCount: number;
  settings: Pick<CampaignSettings, 'startsAt' | 'endsAt' | 'language' | 'onePerMobile'>;
  dataPolicy: DataPolicy;
  questions: PublicQuestion[];
}

export const campaignStatusUpdateSchema = z.object({ status: z.enum(['live', 'closed', 'draft']) });

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  startsAt: null,
  endsAt: null,
  onePerMobile: true,
  resultsVisibility: 'immediate',
  showExplanations: true,
  shuffleQuestions: false,
  language: 'hi',
};

export const DEFAULT_DATA_POLICY: DataPolicy = {
  fields: {
    name: { collect: true, required: true, purpose: 'प्रविष्टि की पहचान के लिए' },
    tehsil: { collect: true, required: true, purpose: 'क्षेत्र-वार जागरूकता विश्लेषण (केवल समेकित आँकड़े)' },
    district: { collect: true, required: true, purpose: 'क्षेत्र-वार जागरूकता विश्लेषण (केवल समेकित आँकड़े)' },
  },
  minors: 'guardian',
  guardianMethods: ['declaration'],
  retentionDays: 180,
  noticeVersion: NOTICE_VERSION,
};

/** Total achievable score for a set of questions (open-text questions carry no marks). */
export function maxScoreOf(questions: readonly Question[]): number {
  return questions.reduce((sum, q) => sum + (isChoiceQuestion(q) ? q.points : 0), 0);
}
