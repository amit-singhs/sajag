import type { CampaignInput, CampaignSettings, DataPolicy, FieldPolicy, OptionalPersonalField, Question, QuestionType } from '@sajag/shared';
import { blankQuestion, duplicateQuestion } from './question-ops';

export interface BuilderState {
  draft: CampaignInput;
  active: number;
  dirty: boolean;
}

type Meta = Pick<CampaignInput, 'title' | 'summary' | 'organizer' | 'tags'>;

export type BuilderAction =
  | { type: 'load'; draft: CampaignInput }
  | { type: 'saved' }
  | { type: 'meta'; patch: Partial<Meta> }
  | { type: 'settings'; patch: Partial<CampaignSettings> }
  | { type: 'policy'; patch: Partial<Omit<DataPolicy, 'fields'>> }
  | { type: 'field'; key: OptionalPersonalField; patch: Partial<FieldPolicy> }
  | { type: 'question'; index: number; question: Question }
  | { type: 'add'; questionType: QuestionType }
  | { type: 'remove'; index: number }
  | { type: 'duplicate'; index: number }
  | { type: 'move'; index: number; by: -1 | 1 }
  | { type: 'select'; index: number };

const withQuestions = (state: BuilderState, questions: Question[], active: number): BuilderState => ({
  draft: { ...state.draft, questions },
  active: Math.max(0, Math.min(active, questions.length - 1)),
  dirty: true,
});

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  const { draft } = state;
  const qs = draft.questions;
  switch (action.type) {
    case 'load':
      return { draft: action.draft, active: 0, dirty: false };
    case 'saved':
      return { ...state, dirty: false };
    case 'meta':
      return { ...state, dirty: true, draft: { ...draft, ...action.patch } };
    case 'settings':
      return { ...state, dirty: true, draft: { ...draft, settings: { ...draft.settings, ...action.patch } } };
    case 'policy':
      return { ...state, dirty: true, draft: { ...draft, dataPolicy: { ...draft.dataPolicy, ...action.patch } } };
    case 'field': {
      const fields = { ...draft.dataPolicy.fields, [action.key]: { ...draft.dataPolicy.fields[action.key], ...action.patch } };
      return { ...state, dirty: true, draft: { ...draft, dataPolicy: { ...draft.dataPolicy, fields } } };
    }
    case 'question':
      return withQuestions(state, qs.map((q, i) => (i === action.index ? action.question : q)), state.active);
    case 'add':
      return withQuestions(state, [...qs, blankQuestion(action.questionType)], qs.length);
    case 'remove':
      return qs.length < 2 ? state : withQuestions(state, qs.filter((_, i) => i !== action.index), action.index - 1);
    case 'duplicate': {
      const source = qs[action.index];
      if (!source) return state;
      const next = [...qs];
      next.splice(action.index + 1, 0, duplicateQuestion(source));
      return withQuestions(state, next, action.index + 1);
    }
    case 'move': {
      const target = action.index + action.by;
      const a = qs[action.index];
      const b = qs[target];
      if (!a || !b) return state;
      const next = [...qs];
      next[action.index] = b;
      next[target] = a;
      return withQuestions(state, next, target);
    }
    case 'select':
      return { ...state, active: action.index };
  }
}
