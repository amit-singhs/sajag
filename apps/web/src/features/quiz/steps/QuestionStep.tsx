import type { PublicQuestion } from '@sajag/shared';
import { Button } from '../../../components/ui/Button';
import { ChoiceButton } from '../../../components/ui/Choice';
import { ErrorNotice } from '../../../components/ui/Feedback';
import { TextArea } from '../../../components/ui/Field';
import { pad2 } from '../../../lib/labels';
import { EMPTY_ANSWER, isAnswered, type AnswerDraft } from '../quiz-state';

interface QuestionStepProps {
  question: PublicQuestion;
  index: number;
  total: number;
  answer: AnswerDraft | undefined;
  submitting: boolean;
  submitError: unknown;
  onAnswer: (draft: AnswerDraft) => void;
  onPrev: () => void;
  onNext: () => void;
}

const LETTERS = 'ABCDEFGH';

export const questionHint = (q: Pick<PublicQuestion, 'type'>): string =>
  q.type === 'multi' ? 'एक से अधिक उत्तर सही हो सकते हैं — सभी चुनें' : q.type === 'text' ? 'अपना उत्तर लिखें' : 'एक उत्तर चुनें';

export function QuestionStep({ question, index, total, answer, submitting, submitError, onAnswer, onPrev, onNext }: QuestionStepProps) {
  const current = answer ?? EMPTY_ANSWER;
  const isLast = index === total - 1;
  const canProceed = !question.required || isAnswered(question, answer);
  const progress = Math.round(((index + 1) / total) * 100);

  const toggle = (optionId: string) => {
    const selected = current.optionIds.includes(optionId);
    const optionIds =
      question.type === 'multi'
        ? selected
          ? current.optionIds.filter((id) => id !== optionId)
          : [...current.optionIds, optionId]
        : [optionId];
    onAnswer({ ...current, optionIds });
  };

  return (
    <section className="step container narrow">
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="प्रगति">
        <span className="progress__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="row-between mono muted">
        <span>
          प्रश्न <strong className="ink">{pad2(index + 1)}</strong> / {pad2(total)}
        </span>
        <span className="accent">
          {question.topic}
          {question.points > 0 && ` · ${question.points} अंक`}
        </span>
      </div>
      <h1 className="question-text">{question.text}</h1>
      <p className={`hint${question.type === 'multi' ? ' hint--strong' : ''}`}>{questionHint(question)}</p>

      {question.type === 'text' ? (
        <TextArea label="आपका उत्तर" value={current.text} maxLength={1000} onChange={(e) => onAnswer({ ...current, text: e.target.value })} hint="कोई निजी जानकारी (नाम, पता, फ़ोन) न लिखें।" />
      ) : (
        <div className="stack-sm" role={question.type === 'multi' ? 'group' : 'radiogroup'} aria-label="विकल्प">
          {question.options.map((o, i) => (
            <ChoiceButton
              key={o.id}
              kind={question.type === 'multi' ? 'checkbox' : 'radio'}
              letter={LETTERS[i]}
              selected={current.optionIds.includes(o.id)}
              onSelect={() => toggle(o.id)}
            >
              {o.text}
            </ChoiceButton>
          ))}
        </div>
      )}

      {submitError ? <ErrorNotice error={submitError} /> : null}
      <div className="step__footer row-between">
        <Button variant="ghost" icon="arrowLeft" onClick={onPrev}>
          पिछला
        </Button>
        <Button iconAfter={isLast ? undefined : 'arrowRight'} disabled={!canProceed} loading={submitting} onClick={onNext}>
          {isLast ? 'जमा करें' : 'अगला'}
        </Button>
      </div>
    </section>
  );
}
