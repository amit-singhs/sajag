import type { QuestionAnalytics } from '@sajag/shared';
import { Legend, MeterRow } from '../../../components/ui/Charts';
import { QUESTION_TYPE_LABEL, pad2 } from '../../../lib/labels';

const LETTERS = 'ABCDEFGH';
const percent = (count: number, of: number) => (of > 0 ? Math.round((count / of) * 100) : 0);

/** Detail for one question, shaped by its type: option bars for choice questions, answers for open text. */
function QuestionDetail({ q }: { q: QuestionAnalytics }) {
  if (q.type === 'text') {
    return q.textAnswers.length === 0 ? (
      <p className="muted">कोई लिखित उत्तर नहीं (या केवल नाबालिगों के, जो दिखाए नहीं जाते)।</p>
    ) : (
      <ul className="answer-list">
        {q.textAnswers.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="stack-xs">
      {q.type === 'multi' && <p className="muted small">एक व्यक्ति कई विकल्प चुन सकता है, इसलिए प्रतिशत का जोड़ 100 से अधिक हो सकता है।</p>}
      {q.options.map((o, i) => (
        <MeterRow
          key={o.id}
          label={LETTERS[i] ?? '·'}
          sub={`${o.correct ? '✓ ' : ''}${o.text} · ${o.count}`}
          percent={percent(o.count, q.answered)}
          hot={!o.correct}
        />
      ))}
    </div>
  );
}

/**
 * Works for any campaign structure. Scored questions are ranked by correct-answer rate; every question can be
 * expanded to show how people actually answered (option counts, or open-text answers for owners).
 */
export function QuestionInsights({ questions }: { questions: readonly QuestionAnalytics[] }) {
  const scored = questions.filter((q) => q.correctRate !== null && q.answered > 0);
  const confusing = new Set(
    [...scored]
      .sort((a, b) => (a.correctRate ?? 0) - (b.correctRate ?? 0))
      .slice(0, 3)
      .map((q) => q.questionId),
  );

  return (
    <section className="card stack-md">
      <div className="row-between">
        <div className="stack-xs">
          <h2 className="title-3">प्रश्न-वार विश्लेषण</h2>
          <p className="muted">किसी प्रश्न पर क्लिक करें — देखें लोगों ने कौन-से विकल्प चुने। जिन प्रश्नों में सबसे कम सही उत्तर मिले, वहीं अगले सत्र की ज़रूरत है।</p>
        </div>
        {scored.length > 0 && <Legend items={[{ tone: 'hot', label: 'सबसे अधिक भ्रम (निचले 3) / गलत विकल्प' }]} />}
      </div>
      <div className="insights">
        {questions.map((q) => (
          <details key={q.questionId} className="insight">
            <summary className="insight__summary">
              <span className="mono muted">Q{pad2(q.index)}</span>
              <span className="insight__title">
                <span className="clamp-2">{q.topic || q.text}</span>
                <span className="muted small">
                  {QUESTION_TYPE_LABEL[q.type]} · {q.answered} उत्तर
                </span>
              </span>
              {q.correctRate !== null ? (
                <span className={`insight__rate${confusing.has(q.questionId) ? ' is-hot' : ''}`}>{q.correctRate}% सही</span>
              ) : (
                <span className="insight__rate is-neutral">बिना अंक</span>
              )}
            </summary>
            <div className="insight__body">
              <p className="insight__question">{q.text}</p>
              <QuestionDetail q={q} />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
