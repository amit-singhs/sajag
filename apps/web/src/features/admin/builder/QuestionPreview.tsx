import type { Question } from '@sajag/shared';
import { ChoiceButton } from '../../../components/ui/Choice';
import { questionHint } from '../../quiz/steps/QuestionStep';

/** Live phone-sized preview, rendered with the same ChoiceButton participants see. */
export function QuestionPreview({ question, index, total }: { question: Question; index: number; total: number }) {
  return (
    <aside className="preview" aria-label="मोबाइल पूर्वावलोकन">
      <span className="eyebrow">मोबाइल पूर्वावलोकन</span>
      <div className="phone">
        <div className="progress">
          <span className="progress__fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <span className="mono muted">
          प्रश्न {index + 1} / {total}
        </span>
        <p className="question-text question-text--sm">{question.text || 'प्रश्न यहाँ दिखेगा'}</p>
        <p className={`hint${question.type === 'multi' ? ' hint--strong' : ''}`}>{questionHint(question)}</p>
        {question.type === 'text' ? (
          <div className="input input--area" aria-hidden="true" />
        ) : (
          <div className="stack-xs">
            {question.options.map((o, i) => (
              <ChoiceButton key={o.id} kind={question.type === 'multi' ? 'checkbox' : 'radio'} letter={'ABCDEFGH'[i]} selected={false} onSelect={() => undefined} disabled>
                {o.text || '…'}
              </ChoiceButton>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
