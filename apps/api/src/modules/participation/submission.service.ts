import {
  OPTIONAL_PERSONAL_FIELDS,
  maskMobile,
  maxScoreOf,
  scoreAnswer,
  type ConsentMethod,
  type DataPolicy,
  type ParticipantInput,
  type Question,
  type QuestionReview,
  type ScoredAnswer,
  type SubmissionInput,
  type SubmissionResult,
} from '@sajag/shared';
import type { CampaignDocument } from '../../db/mongo';
import { prisma } from '../../db/prisma';
import { encrypt, keyedHash } from '../../lib/crypto';
import { addDays } from '../../lib/dates';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';
import { campaignService } from '../campaigns/campaign.service';
import { otpService } from '../otp/otp.service';

interface GradedQuestion {
  question: Question;
  selected: string[];
  text: string | undefined;
  result: ScoredAnswer;
}

type PersonalDetails = Record<(typeof OPTIONAL_PERSONAL_FIELDS)[number], string | null>;

/** Data minimisation: keep only the fields this campaign declared, and enforce the required ones. */
function collectPersonalDetails(policy: DataPolicy, participant: ParticipantInput): PersonalDetails {
  const details = {} as PersonalDetails;
  for (const key of OPTIONAL_PERSONAL_FIELDS) {
    const field = policy.fields[key];
    const value = participant[key]?.trim() || null;
    if (field.collect && field.required && !value) throw Errors.badRequest(`Field "${key}" is required`);
    details[key] = field.collect ? value : null;
  }
  return details;
}

function resolveConsentMethod(campaign: CampaignDocument, input: SubmissionInput): ConsentMethod {
  if (input.participant.ageBand === 'adult') return 'self';

  const { dataPolicy } = campaign;
  const { guardian } = input;
  if (dataPolicy.minors === 'disallow') throw Errors.forbidden('This campaign is open only to people aged 18 or above');
  if (!guardian) throw Errors.badRequest('Verified consent from a parent or guardian is required');
  if (!dataPolicy.guardianMethods.includes(guardian.method)) throw Errors.badRequest('This verification method is not enabled');
  if (guardian.mobile === input.participant.mobile) {
    throw Errors.badRequest("The guardian's mobile number must be different from the participant's");
  }
  switch (guardian.method) {
    case 'declaration':
      // Guardian declares identity, relation and mobile (not verified) and consents.
      return 'guardian_declared';
    case 'otp':
      if (!guardian.verificationToken) throw Errors.badRequest('Guardian verification is required');
      otpService.assertVerified(guardian.verificationToken, 'guardian_consent', guardian.mobile);
      return 'guardian_otp';
    case 'digilocker':
      throw Errors.notImplemented('DigiLocker verification is not configured yet');
  }
}

function gradeAnswers(questions: readonly Question[], input: SubmissionInput): GradedQuestion[] {
  const answers = new Map(input.answers.map((a) => [a.questionId, a]));
  const known = new Set(questions.map((q) => q.id));
  if ([...answers.keys()].some((id) => !known.has(id))) throw Errors.badRequest('Answer refers to an unknown question');

  return questions.map((question) => {
    const answer = answers.get(question.id);
    const selected = [...new Set(answer?.optionIds ?? [])];
    const text = answer?.text?.trim() || undefined;

    if (question.type === 'text') {
      if (question.required && !text) throw Errors.badRequest(`Question ${question.id} needs an answer`);
    } else {
      const optionIds = new Set(question.options.map((o) => o.id));
      if (selected.some((id) => !optionIds.has(id))) throw Errors.badRequest(`Invalid option for question ${question.id}`);
      if (question.type !== 'multi' && selected.length > 1) throw Errors.badRequest(`Pick one option for question ${question.id}`);
      if (question.required && selected.length === 0) throw Errors.badRequest(`Question ${question.id} needs an answer`);
    }
    return { question, selected, text, result: scoreAnswer(question, selected) };
  });
}

function toReview(graded: GradedQuestion, showExplanation: boolean): QuestionReview {
  const { question, selected, result } = graded;
  const options =
    question.type === 'text'
      ? []
      : question.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct, selected: selected.includes(o.id) }));
  return {
    questionId: question.id,
    type: question.type,
    text: question.text,
    topic: question.topic,
    options,
    isCorrect: result.isCorrect,
    pointsAwarded: result.pointsAwarded,
    maxPoints: result.maxPoints,
    explanation: showExplanation ? question.explanation : '',
  };
}

export const submissionService = {
  async submit(slug: string, input: SubmissionInput): Promise<SubmissionResult> {
    const campaign = await campaignService.requireOpenBySlug(slug);
    const campaignId = campaign._id.toHexString();
    const { participant, guardian, consent } = input;

    if (consent.noticeVersion !== campaign.dataPolicy.noticeVersion) {
      throw Errors.conflict('The privacy notice has been updated. Please review it again before continuing.');
    }
    const consentMethod = resolveConsentMethod(campaign, input);
    const details = collectPersonalDetails(campaign.dataPolicy, participant);
    const graded = gradeAnswers(campaign.questions, input);

    const mobileHash = keyedHash(participant.mobile);
    if (campaign.settings.onePerMobile) {
      const existing = await prisma.participant.count({ where: { campaignId, mobileHash } });
      if (existing > 0) throw Errors.conflict('This mobile number has already taken part in this campaign');
    }

    const score = graded.reduce((sum, g) => sum + g.result.pointsAwarded, 0);
    const maxScore = maxScoreOf(campaign.questions);
    const erasureBase = campaign.settings.endsAt ? new Date(campaign.settings.endsAt) : new Date();
    const scheduledErasureAt = addDays(erasureBase, campaign.dataPolicy.retentionDays);
    const isGuardianConsent = consentMethod !== 'self' && guardian;

    const submission = await prisma.$transaction(async (tx) => {
      const person = await tx.participant.create({
        data: {
          campaignId,
          mobileHash,
          mobileEnc: encrypt(participant.mobile),
          mobileMasked: maskMobile(participant.mobile),
          ...details,
          ageBand: participant.ageBand,
          scheduledErasureAt,
        },
      });
      await tx.consent.create({
        data: {
          participantId: person.id,
          method: consentMethod,
          noticeVersion: consent.noticeVersion,
          language: consent.language,
          ...(isGuardianConsent
            ? {
                guardianName: guardian.name,
                guardianRelation: guardian.relation,
                guardianMobileHash: keyedHash(guardian.mobile),
                guardianMobileEnc: encrypt(guardian.mobile),
              }
            : {}),
        },
      });
      const created = await tx.submission.create({
        data: {
          participantId: person.id,
          campaignId,
          score,
          maxScore,
          answersJson: JSON.stringify(graded.map((g) => ({ questionId: g.question.id, optionIds: g.selected, text: g.text }))),
        },
      });
      await tx.answerResult.createMany({
        data: graded.map((g) => ({
          submissionId: created.id,
          campaignId,
          questionId: g.question.id,
          isCorrect: g.result.isCorrect,
          pointsAwarded: g.result.pointsAwarded,
        })),
      });
      await recordAudit(
        { actorId: null, action: 'submission.create', entity: 'submission', entityId: created.id, meta: { campaignId, consentMethod } },
        tx,
      );
      return created;
    });

    const resultsVisible = campaign.settings.resultsVisibility === 'immediate';
    return {
      submissionId: submission.id,
      score: resultsVisible ? score : 0,
      maxScore: resultsVisible ? maxScore : 0,
      resultsVisible,
      review: resultsVisible ? graded.map((g) => toReview(g, campaign.settings.showExplanations)) : [],
      scheduledErasureAt: scheduledErasureAt.toISOString(),
    };
  },
};
