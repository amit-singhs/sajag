import { useMutation } from '@tanstack/react-query';
import {
  DATA_REQUEST_TYPES,
  DETAIL_REQUIRED_REQUEST_TYPES,
  INDIAN_MOBILE_REGEX,
  normalizeMobileInput,
  type DataRequestType,
} from '@sajag/shared';
import { useState, type FormEvent } from 'react';
import { usePublicConfig } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';
import { ChoiceButton } from '../../components/ui/Choice';
import { ErrorNotice, Notice } from '../../components/ui/Feedback';
import { TextArea, TextField } from '../../components/ui/Field';
import { publicApi } from '../../lib/api/endpoints';
import { REQUEST_TYPE_LABEL, formatDate } from '../../lib/labels';

/** What each request type means, in plain words for the person filing it. */
const REQUEST_HELP: Record<DataRequestType, string> = {
  access: 'हमारे पास आपकी कौन-सी जानकारी है, यह जानना चाहते हैं',
  correction: 'नाम, तहसील या ज़िले में कोई गलती ठीक करवानी है',
  erasure: 'अपनी सारी व्यक्तिगत जानकारी मिटवाना चाहते हैं',
  withdrawal: 'दी गई सहमति वापस लेना चाहते हैं (जानकारी भी मिटा दी जाएगी)',
  grievance: 'किसी बात की शिकायत करनी है',
  nomination: 'आपकी मृत्यु या अक्षमता की स्थिति में अधिकारों के लिए किसी को नामित करना है',
};

export function MyDataPage() {
  const { data: config } = usePublicConfig();
  const [mobile, setMobile] = useState('');
  const [type, setType] = useState<DataRequestType>('access');
  const [details, setDetails] = useState('');
  const file = useMutation({ mutationFn: () => publicApi.fileDataRequest({ mobile, type, details: details.trim() }) });

  const mobileValid = INDIAN_MOBILE_REGEX.test(mobile);
  const needsDetails = DETAIL_REQUIRED_REQUEST_TYPES.includes(type);
  const canSubmit = mobileValid && (!needsDetails || details.trim().length >= 5);
  const officer = config?.grievanceOfficer;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) file.mutate();
  };

  if (file.data) {
    return (
      <section className="container narrow section stack-lg">
        <Notice tone="success" title="आपका अनुरोध दर्ज हो गया है">
          संदर्भ संख्या <strong className="mono">{file.data.reference}</strong>। हम {formatDate(file.data.dueAt)} तक आपके मोबाइल नंबर पर संपर्क करके पहचान
          की पुष्टि करेंगे और अनुरोध पूरा करेंगे।
        </Notice>
        <Button
          variant="ghost"
          onClick={() => {
            file.reset();
            setDetails('');
          }}
        >
          एक और अनुरोध भेजें
        </Button>
      </section>
    );
  }

  return (
    <section className="container narrow section stack-lg">
      <div className="stack-sm">
        <span className="eyebrow">मेरा डेटा</span>
        <h1 className="display-2">अपनी जानकारी के बारे में अनुरोध भेजें</h1>
        <p className="lead">
          जिस मोबाइल नंबर से आपने प्रश्नावली भरी थी, वही नंबर लिखें और बताएँ कि आप क्या चाहते हैं। हमारी टीम उसी नंबर पर संपर्क करके आपकी पहचान की पुष्टि करेगी।
        </p>
      </div>

      <form className="stack-lg" onSubmit={onSubmit}>
        <TextField
          label="मोबाइल नंबर"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="10 अंक"
          value={mobile}
          onChange={(e) => setMobile(normalizeMobileInput(e.target.value))}
          error={mobile.length === 10 && !mobileValid ? 'कृपया सही मोबाइल नंबर दर्ज करें' : undefined}
        />

        <fieldset className="fieldset stack-sm">
          <legend className="field__label">आप क्या चाहते हैं?</legend>
          {DATA_REQUEST_TYPES.map((t) => (
            <ChoiceButton key={t} kind="radio" selected={type === t} onSelect={() => setType(t)}>
              <strong>{REQUEST_TYPE_LABEL[t]}</strong>
              <span className="choice__help">{REQUEST_HELP[t]}</span>
            </ChoiceButton>
          ))}
        </fieldset>

        <TextArea
          label={needsDetails ? 'विवरण' : 'विवरण (वैकल्पिक)'}
          value={details}
          maxLength={2000}
          onChange={(e) => setDetails(e.target.value)}
          hint={type === 'nomination' ? 'उस व्यक्ति का नाम, संबंध और मोबाइल नंबर लिखें।' : undefined}
        />

        {(type === 'erasure' || type === 'withdrawal') && (
          <Notice tone="warn">पुष्टि के बाद आपकी व्यक्तिगत जानकारी स्थायी रूप से मिटा दी जाएगी; केवल बिना पहचान वाले आँकड़े रहेंगे।</Notice>
        )}
        {file.error && <ErrorNotice error={file.error} />}
        <Button type="submit" block disabled={!canSubmit} loading={file.isPending}>
          अनुरोध भेजें
        </Button>
      </form>

      <p className="muted">
        अनुरोधों का उत्तर 30 दिनों के भीतर दिया जाता है। शिकायत अधिकारी: {officer?.name || '—'}
        {officer?.email && (
          <>
            {' '}
            · <a href={`mailto:${officer.email}`}>{officer.email}</a>
          </>
        )}
        । समाधान न होने पर आप भारत के डेटा संरक्षण बोर्ड से संपर्क कर सकते हैं।
      </p>
    </section>
  );
}
