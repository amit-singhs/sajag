import type { QuestionReview, SubmissionResult } from '@sajag/shared';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { formatDate, pad2 } from '../../../lib/labels';

function verdict(score: number, max: number): string {
  const ratio = max ? score / max : 0;
  if (ratio >= 0.85) return 'बहुत बढ़िया — आप एक सजग नागरिक हैं।';
  if (ratio >= 0.6) return 'अच्छी जानकारी, कुछ बातें और जानिए।';
  return 'जानने को अभी बहुत कुछ है।';
}

function ReviewItem({ item, index }: { item: QuestionReview; index: number }) {
  const correctOptions = item.options.filter((o) => o.correct);
  const wrongPicks = item.options.filter((o) => o.selected && !o.correct);
  const tone = item.isCorrect === null ? 'neutral' : item.isCorrect ? 'ok' : 'bad';
  return (
    <li className="review">
      <span className={`review__mark review__mark--${tone}`} aria-label={tone === 'ok' ? 'सही' : tone === 'bad' ? 'गलत' : 'बिना अंक'}>
        {pad2(index + 1)}
      </span>
      <div className="stack-sm">
        <p className="review__q">{item.text}</p>
        {correctOptions.length > 0 && (
          <p>
            <span className="tag-label tag-label--ok">सही उत्तर · </span>
            {correctOptions.map((o) => o.text).join(' / ')}
          </p>
        )}
        {wrongPicks.length > 0 && (
          <p className="muted">
            <span className="tag-label tag-label--bad">आपने चुना · </span>
            {wrongPicks.map((o) => o.text).join(' / ')}
          </p>
        )}
        {item.maxPoints > 0 && (
          <p className="mono muted">
            {item.pointsAwarded} / {item.maxPoints} अंक
          </p>
        )}
        {item.explanation && <p className="callout">{item.explanation}</p>}
      </div>
    </li>
  );
}

export function ResultView({ result, campaignTitle }: { result: SubmissionResult; campaignTitle: string }) {
  const share = () => {
    const url = window.location.href;
    const text = `${campaignTitle} — कानूनी जागरूकता प्रश्नावली: ${url}`;
    if (navigator.share) void navigator.share({ title: campaignTitle, url }).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <section className="container narrow section stack-lg">
      <div className="result-hero">
        <span className="eyebrow eyebrow--light">आपका उत्तर दर्ज हो गया है</span>
        {result.resultsVisible ? (
          <>
            <div className="result-hero__score">
              <span>{result.score}</span>
              <span className="result-hero__max">/ {result.maxScore}</span>
            </div>
            <h1 className="display-3">{verdict(result.score, result.maxScore)}</h1>
          </>
        ) : (
          <h1 className="display-3">धन्यवाद! परिणाम अभियान समाप्त होने पर साझा किए जाएँगे।</h1>
        )}
      </div>

      {result.review.length > 0 && (
        <div className="stack-md">
          <h2 className="title-2">उत्तर और व्याख्या</h2>
          <ol className="review-list">
            {result.review.map((item, i) => (
              <ReviewItem key={item.questionId} item={item} index={i} />
            ))}
          </ol>
        </div>
      )}

      <div className="callout stack-sm">
        <strong>आपका डेटा</strong>
        <p>
          आपकी व्यक्तिगत जानकारी {formatDate(result.scheduledErasureAt)} को अपने-आप मिट जाएगी। आप इसे अभी भी देख या मिटवा सकते हैं —{' '}
          <Link to="/my-data">मेरा डेटा</Link>।
        </p>
      </div>

      <div className="stack-xs">
        <Button block onClick={share}>
          परिवार को यह प्रश्नावली भेजें
        </Button>
        <p className="muted center">केवल अभियान का लिंक जाएगा, आपका स्कोर नहीं।</p>
      </div>
    </section>
  );
}
