import type {
  AgeBand,
  GuardianRelation,
  NoticeLanguage,
  PublicCampaign,
  PublicQuestion,
  SubmissionInput,
  SubmissionResult,
} from '@sajag/shared';

export type QuizStep = 'consent' | 'details' | 'guardian' | 'questions' | 'result';

export interface ParticipantDraft {
  mobile: string;
  ageBand: AgeBand | null;
  name: string;
  tehsil: string;
  district: string;
}

export interface GuardianDraft {
  name: string;
  relation: GuardianRelation;
  /** Declared by the guardian; not verified for now. */
  mobile: string;
  declared: boolean;
}

export interface AnswerDraft {
  optionIds: string[];
  text: string;
}

export interface QuizState {
  step: QuizStep;
  language: NoticeLanguage;
  consented: boolean;
  participant: ParticipantDraft;
  guardian: GuardianDraft;
  answers: Record<string, AnswerDraft>;
  index: number;
  result: SubmissionResult | null;
}

export type QuizAction =
  | { type: 'language'; language: NoticeLanguage }
  | { type: 'consent'; value: boolean }
  | { type: 'participant'; patch: Partial<ParticipantDraft> }
  | { type: 'guardian'; patch: Partial<GuardianDraft> }
  | { type: 'go'; step: QuizStep }
  | { type: 'answer'; questionId: string; draft: AnswerDraft }
  | { type: 'index'; index: number }
  | { type: 'finish'; result: SubmissionResult };

export const initialQuizState: QuizState = {
  step: 'consent',
  language: 'hi',
  consented: false,
  participant: { mobile: '', ageBand: null, name: '', tehsil: '', district: '' },
  guardian: { name: '', relation: 'mother', mobile: '', declared: false },
  answers: {},
  index: 0,
  result: null,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'language':
      return { ...state, language: action.language };
    case 'consent':
      return { ...state, consented: action.value };
    case 'participant':
      return { ...state, participant: { ...state.participant, ...action.patch } };
    case 'guardian':
      return { ...state, guardian: { ...state.guardian, ...action.patch } };
    case 'go':
      return { ...state, step: action.step };
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.draft } };
    case 'index':
      return { ...state, index: action.index };
    case 'finish':
      return { ...state, step: 'result', result: action.result };
  }
}

export const EMPTY_ANSWER: AnswerDraft = { optionIds: [], text: '' };

export function isAnswered(question: PublicQuestion, answer: AnswerDraft | undefined): boolean {
  if (!answer) return false;
  return question.type === 'text' ? answer.text.trim().length > 0 : answer.optionIds.length > 0;
}

const trimmedOrUndefined = (v: string) => v.trim() || undefined;

export function buildSubmission(state: QuizState, campaign: PublicCampaign): SubmissionInput {
  const { participant, guardian } = state;
  const isMinor = participant.ageBand === 'minor';
  return {
    participant: {
      mobile: participant.mobile,
      ageBand: participant.ageBand ?? 'adult',
      name: trimmedOrUndefined(participant.name),
      tehsil: trimmedOrUndefined(participant.tehsil),
      district: trimmedOrUndefined(participant.district),
    },
    consent: { accepted: true, noticeVersion: campaign.dataPolicy.noticeVersion, language: state.language },
    ...(isMinor
      ? { guardian: { name: guardian.name.trim(), relation: guardian.relation, mobile: guardian.mobile, method: 'declaration' as const } }
      : {}),
    answers: campaign.questions
      .filter((q) => isAnswered(q, state.answers[q.id]))
      .map((q) => {
        const a = state.answers[q.id] ?? EMPTY_ANSWER;
        return q.type === 'text' ? { questionId: q.id, text: a.text.trim() } : { questionId: q.id, optionIds: a.optionIds };
      }),
  };
}
