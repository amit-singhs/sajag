import type { NoticeLanguage, PublicCampaign } from '@sajag/shared';
import { Button } from '../../../components/ui/Button';
import { Segmented } from '../../../components/ui/Choice';
import { Checkbox } from '../../../components/ui/Field';
import { PrivacyNotice } from '../../privacy-notice/PrivacyNotice';
import { StepFrame } from './StepFrame';

interface ConsentStepProps {
  campaign: PublicCampaign;
  language: NoticeLanguage;
  consented: boolean;
  onLanguage: (language: NoticeLanguage) => void;
  onConsent: (value: boolean) => void;
  onNext: () => void;
}

export function ConsentStep({ campaign, language, consented, onLanguage, onConsent, onNext }: ConsentStepProps) {
  return (
    <StepFrame
      eyebrow="चरण 1 · गोपनीयता सूचना"
      title="आपकी जानकारी, आपका अधिकार"
      intro="शुरू करने से पहले जानिए कि हम क्या लेते हैं, क्यों लेते हैं, और आप इसे कैसे नियंत्रित कर सकते हैं।"
      aside={
        <Segmented
          label="सूचना की भाषा"
          value={language}
          onChange={onLanguage}
          options={[
            { value: 'hi', label: 'हिंदी' },
            { value: 'en', label: 'English' },
          ]}
        />
      }
      footer={
        <Button block iconAfter="arrowRight" disabled={!consented} onClick={onNext}>
          सहमति दें और आगे बढ़ें
        </Button>
      }
    >
      <PrivacyNotice policy={campaign.dataPolicy} />
      <Checkbox
        checked={consented}
        onChange={onConsent}
        label="मैंने सूचना पढ़ ली है और ऊपर बताए उद्देश्यों के लिए अपनी जानकारी देने की सहमति देता/देती हूँ। (18 वर्ष से कम आयु होने पर अगले चरणों में अभिभावक की सहमति ली जाएगी।)"
      />
    </StepFrame>
  );
}
