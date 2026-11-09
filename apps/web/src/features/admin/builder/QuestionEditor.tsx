import { QUESTION_TYPES, SCORING_MODES, type ChoiceQuestion, type Question } from '@sajag/shared';
import { IconButton } from '../../../components/ui/Button';
import { Segmented } from '../../../components/ui/Choice';
import { Notice } from '../../../components/ui/Feedback';
import { Checkbox, TextArea, TextField } from '../../../components/ui/Field';
import { Icon } from '../../../components/ui/Icon';
import { QUESTION_TYPE_LABEL, SCORING_LABEL, pad2 } from '../../../lib/labels';
import { addOption, changeType, removeOption, setOptionText, toggleCorrect } from './question-ops';

interface QuestionEditorProps {
  question: Question;
  index: number;
  total: number;
  onChange: (question: Question) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMove: (by: -1 | 1) => void;
}

const LETTERS = 'ABCDEFGH';
const TYPE_OPTIONS = QUESTION_TYPES.map((value) => ({ value, label: QUESTION_TYPE_LABEL[value] }));
const SCORING_OPTIONS = SCORING_MODES.map((value) => ({ value, label: SCORING_LABEL[value] }));

function OptionsEditor({ question, onChange }: { question: ChoiceQuestion; onChange: (q: ChoiceQuestion) => void }) {
  const isMulti = question.type === 'multi';
  const locked = question.type === 'true_false';
  const correctCount = question.options.filter((o) => o.correct).length;
  return (
    <div className="stack-sm">
      <div className="row-between">
        <span className="field__label">विकल्प</span>
        <span className="muted">{isMulti ? 'सभी सही विकल्पों पर निशान लगाएँ' : 'सही उत्तर पर निशान लगाएँ'}</span>
      </div>
      {question.options.map((o, i) => (
        <div key={o.id} className="option-row">
          <button
            type="button"
            role={isMulti ? 'checkbox' : 'radio'}
            aria-checked={o.correct}
            aria-label={`विकल्प ${LETTERS[i]} को सही चिह्नित करें`}
            className={`mark mark--${isMulti ? 'check' : 'radio'}${o.correct ? ' is-on' : ''}`}
            onClick={() => onChange(toggleCorrect(question, o.id))}
          >
            <Icon name="check" size={14} strokeWidth={3} />
          </button>
          <span className="mono muted option-row__letter">{LETTERS[i]}</span>
          <input
            className="input"
            aria-label={`विकल्प ${LETTERS[i]}`}
            value={o.text}
            readOnly={locked}
            onChange={(e) => onChange(setOptionText(question, o.id, e.target.value))}
          />
          {!locked && question.options.length > 2 && (
            <IconButton icon="close" label={`विकल्प ${LETTERS[i]} हटाएँ`} onClick={() => onChange(removeOption(question, o.id))} />
          )}
        </div>
      ))}
      {!locked && question.options.length < 8 && (
        <button type="button" className="link-btn" onClick={() => onChange(addOption(question))}>
          + विकल्प जोड़ें
        </button>
      )}
      {correctCount === 0 && <Notice tone="warn">कम से कम एक सही उत्तर चिह्नित करें।</Notice>}
    </div>
  );
}

export function QuestionEditor({ question, index, total, onChange, onDuplicate, onRemove, onMove }: QuestionEditorProps) {
  return (
    <section className="card stack-lg" aria-label={`प्रश्न ${index + 1} का संपादन`}>
      <div className="row-between">
        <span className="mono muted">प्रश्न {pad2(index + 1)}</span>
        <div className="row-tight">
          <IconButton icon="up" label="ऊपर ले जाएँ" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton icon="down" label="नीचे ले जाएँ" disabled={index === total - 1} onClick={() => onMove(1)} />
          <IconButton icon="copy" label="प्रति बनाएँ" onClick={onDuplicate} />
          <IconButton icon="trash" label="प्रश्न हटाएँ" disabled={total < 2} onClick={onRemove} />
        </div>
      </div>

      <div className="stack-sm">
        <span className="field__label">प्रश्न का प्रकार</span>
        <Segmented label="प्रश्न का प्रकार" value={question.type} options={TYPE_OPTIONS} onChange={(type) => onChange(changeType(question, type))} />
      </div>

      <TextArea label="प्रश्न" value={question.text} onChange={(e) => onChange({ ...question, text: e.target.value })} />
      <TextField label="विषय (वैकल्पिक)" value={question.topic} maxLength={80} onChange={(e) => onChange({ ...question, topic: e.target.value })} />

      {question.type === 'text' ? (
        <Notice>खुले उत्तर वाले प्रश्न पर अंक नहीं दिए जाते। सुझाव या राय जानने के लिए उपयोग करें — इसमें कोई निजी जानकारी न माँगें।</Notice>
      ) : (
        <OptionsEditor question={question} onChange={onChange} />
      )}

      {question.type === 'multi' && (
        <div className="stack-sm">
          <span className="field__label">अंक कैसे मिलें</span>
          <Segmented label="अंक कैसे मिलें" value={question.scoring} options={SCORING_OPTIONS} onChange={(scoring) => onChange({ ...question, scoring })} />
          <p className="muted">
            {question.scoring === 'partial'
              ? 'हर सही विकल्प पर अंक का हिस्सा मिलेगा; गलत विकल्प चुनने पर उतना कटेगा (शून्य से कम नहीं)।'
              : 'पूरे अंक तभी मिलेंगे जब सभी सही विकल्प चुने जाएँ और कोई गलत नहीं।'}
          </p>
        </div>
      )}

      <div className="grid-2">
        {question.type !== 'text' && (
          <TextField
            label="अंक"
            type="number"
            min={0}
            max={100}
            value={question.points}
            onChange={(e) => onChange({ ...question, points: Math.max(0, Math.min(100, Number.parseInt(e.target.value || '0', 10) || 0)) })}
          />
        )}
        <div className="stack-xs field-checks">
          <Checkbox label="उत्तर अनिवार्य" checked={question.required} onChange={(required) => onChange({ ...question, required })} />
          {(question.type === 'single' || question.type === 'multi') && (
            <Checkbox label="विकल्पों का क्रम बदलें" checked={question.shuffleOptions} onChange={(shuffleOptions) => onChange({ ...question, shuffleOptions })} />
          )}
        </div>
      </div>

      {question.type !== 'text' && (
        <TextArea label="व्याख्या — जमा करने के बाद दिखेगी" value={question.explanation} onChange={(e) => onChange({ ...question, explanation: e.target.value })} />
      )}
    </section>
  );
}
