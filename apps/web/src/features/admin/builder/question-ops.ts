import {
  DEFAULT_CAMPAIGN_SETTINGS,
  DEFAULT_DATA_POLICY,
  campaignInputSchema,
  type CampaignInput,
  type ChoiceQuestion,
  type Question,
  type QuestionOption,
  type QuestionType,
} from '@sajag/shared';

/** Pure, immutable operations on questions — the builder UI only composes these. */

export const newId = (): string => crypto.randomUUID().replace(/-/g, '').slice(0, 8);

const option = (text = '', correct = false): QuestionOption => ({ id: newId(), text, correct });
const blankOptions = (): QuestionOption[] => [option(), option(), option(), option()];
const trueFalseOptions = (): QuestionOption[] => [option('सही', true), option('गलत')];

export function blankQuestion(type: QuestionType = 'single'): Question {
  return changeType({ id: newId(), type: 'single', text: '', topic: '', required: true, explanation: '', points: 1, shuffleOptions: false, options: blankOptions() }, type);
}

export function changeType(q: Question, type: QuestionType): Question {
  const base = { id: q.id, text: q.text, topic: q.topic, required: q.required, explanation: q.explanation };
  const points = q.type === 'text' ? 1 : q.points;
  const reusable = q.type === 'single' || q.type === 'multi' ? q.options : blankOptions();
  switch (type) {
    case 'text':
      return { ...base, type };
    case 'true_false':
      return { ...base, type, points, options: trueFalseOptions() };
    case 'multi':
      return { ...base, type, points, scoring: 'all_or_nothing', shuffleOptions: false, options: reusable };
    case 'single': {
      let seen = false;
      const options = reusable.map((o) => {
        const correct = o.correct && !seen;
        if (o.correct) seen = true;
        return { ...o, correct };
      });
      return { ...base, type, points, shuffleOptions: false, options };
    }
  }
}

export function toggleCorrect<Q extends ChoiceQuestion>(q: Q, optionId: string): Q {
  const options = q.options.map((o) =>
    q.type === 'multi' ? (o.id === optionId ? { ...o, correct: !o.correct } : o) : { ...o, correct: o.id === optionId },
  );
  return { ...q, options };
}

export const setOptionText = <Q extends ChoiceQuestion>(q: Q, optionId: string, text: string): Q => ({
  ...q,
  options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
});

export const addOption = <Q extends ChoiceQuestion>(q: Q): Q => ({ ...q, options: [...q.options, option()] });

export const removeOption = <Q extends ChoiceQuestion>(q: Q, optionId: string): Q => ({
  ...q,
  options: q.options.filter((o) => o.id !== optionId),
});

export const duplicateQuestion = (q: Question): Question => {
  const copy = structuredClone(q);
  copy.id = newId();
  if (copy.type !== 'text') copy.options = copy.options.map((o) => ({ ...o, id: newId() }));
  return copy;
};

export function blankCampaign(): CampaignInput {
  return {
    title: 'नया अभियान',
    summary: '',
    organizer: '',
    tags: [],
    settings: { ...DEFAULT_CAMPAIGN_SETTINGS },
    dataPolicy: structuredClone(DEFAULT_DATA_POLICY),
    questions: [blankQuestion('single')],
  };
}

/** Flattens shared-schema validation into readable lines for the builder. */
export function validationIssues(input: CampaignInput): string[] {
  const parsed = campaignInputSchema.safeParse(input);
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => {
    const [head, index] = issue.path;
    const where = head === 'questions' && typeof index === 'number' ? `प्रश्न ${index + 1}: ` : issue.path.length ? `${issue.path.join('.')}: ` : '';
    return `${where}${issue.message}`;
  });
}
