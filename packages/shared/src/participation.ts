import { z } from 'zod';
import { AGE_BANDS, GUARDIAN_METHODS, GUARDIAN_RELATIONS, NOTICE_LANGUAGES, type QuestionType } from './constants';
import { mobileSchema } from './mobile';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const answerSchema = z.object({
  questionId: z.string().min(1).max(64),
  optionIds: z.array(z.string().min(1).max(64)).max(8).optional(),
  text: z.string().trim().max(1000).optional(),
});
export type AnswerInput = z.infer<typeof answerSchema>;

export const participantInputSchema = z.object({
  mobile: mobileSchema,
  ageBand: z.enum(AGE_BANDS),
  name: optionalText(120),
  tehsil: optionalText(80),
  district: optionalText(80),
});
export type ParticipantInput = z.infer<typeof participantInputSchema>;

export const guardianInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    relation: z.enum(GUARDIAN_RELATIONS),
    mobile: mobileSchema,
    method: z.enum(GUARDIAN_METHODS),
    /** Required for verified methods: token from POST /otp/verify (purpose guardian_consent) or the DigiLocker callback. */
    verificationToken: z.string().min(10).optional(),
  })
  .refine((g) => g.method === 'declaration' || Boolean(g.verificationToken), {
    message: 'Verification is required for this method',
    path: ['verificationToken'],
  });
export type GuardianInput = z.infer<typeof guardianInputSchema>;

export const submissionInputSchema = z.object({
  participant: participantInputSchema,
  consent: z.object({
    accepted: z.literal(true),
    noticeVersion: z.string().min(1).max(20),
    language: z.enum(NOTICE_LANGUAGES),
  }),
  guardian: guardianInputSchema.optional(),
  answers: z.array(answerSchema).max(100),
});
export type SubmissionInput = z.infer<typeof submissionInputSchema>;

export interface ReviewOption {
  id: string;
  text: string;
  correct: boolean;
  selected: boolean;
}

export interface QuestionReview {
  questionId: string;
  type: QuestionType;
  text: string;
  topic: string;
  options: ReviewOption[];
  isCorrect: boolean | null;
  pointsAwarded: number;
  maxPoints: number;
  explanation: string;
}

export interface SubmissionResult {
  submissionId: string;
  score: number;
  maxScore: number;
  resultsVisible: boolean;
  review: QuestionReview[];
  scheduledErasureAt: string | null;
}
