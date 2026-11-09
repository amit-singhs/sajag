import { GUARDIAN_RELATIONS, INDIAN_MOBILE_REGEX, normalizeMobileInput, type GuardianRelation } from '@sajag/shared';
import { Button } from '../../../components/ui/Button';
import { Checkbox, SelectField, TextField } from '../../../components/ui/Field';
import { RELATION_LABEL } from '../../../lib/labels';
import type { GuardianDraft } from '../quiz-state';
import { StepFrame } from './StepFrame';

interface GuardianStepProps {
  guardian: GuardianDraft;
  participantMobile: string;
  onChange: (patch: Partial<GuardianDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}

const RELATION_OPTIONS = GUARDIAN_RELATIONS.map((value) => ({ value, label: RELATION_LABEL[value] }));

/** Guardian consent by declaration: name, relation, mobile (not OTP-verified for now) and an explicit consent. */
export function GuardianStep({ guardian, participantMobile, onChange, onBack, onNext }: GuardianStepProps) {
  const mobileComplete = guardian.mobile.length === 10;
  const mobileValid = INDIAN_MOBILE_REGEX.test(guardian.mobile);
  const sameAsChild = mobileComplete && guardian.mobile === participantMobile;
  const mobileError = !mobileComplete ? undefined : !mobileValid ? 'कृपया सही मोबाइल नंबर दर्ज करें' : sameAsChild ? 'अभिभावक का नंबर बच्चे के नंबर से अलग होना चाहिए' : undefined;
  const canContinue = guardian.name.trim().length > 1 && mobileValid && !sameAsChild && guardian.declared;

  return (
    <StepFrame
      eyebrow="चरण 3 · अभिभावक की सहमति"
      title="माता-पिता या अभिभावक के लिए"
      intro="बच्चे की आयु 18 वर्ष से कम है। कानून (DPDP अधिनियम, धारा 9) के अनुसार उसकी जानकारी केवल माता-पिता या अभिभावक की सहमति से ली जा सकती है। कृपया यह चरण स्वयं पूरा करें।"
      footer={
        <div className="row-between">
          <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
            पीछे
          </Button>
          <Button iconAfter="arrowRight" disabled={!canContinue} onClick={onNext}>
            प्रश्न शुरू करें
          </Button>
        </div>
      }
    >
      <div className="grid-2">
        <TextField label="आपका नाम" autoComplete="name" value={guardian.name} onChange={(e) => onChange({ name: e.target.value })} />
        <SelectField<GuardianRelation> label="बच्चे से संबंध" value={guardian.relation} options={RELATION_OPTIONS} onChange={(relation) => onChange({ relation })} />
      </div>
      <TextField
        label="आपका मोबाइल नंबर"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="10 अंक"
        value={guardian.mobile}
        onChange={(e) => onChange({ mobile: normalizeMobileInput(e.target.value) })}
        error={mobileError}
        hint="सहमति के रिकॉर्ड के लिए। ज़रूरत पड़ने पर इसी नंबर पर संपर्क किया जा सकता है।"
      />
      <Checkbox
        checked={guardian.declared}
        onChange={(declared) => onChange({ declared })}
        label="मैं इस बच्चे का माता-पिता/कानूनी अभिभावक हूँ। मैंने गोपनीयता सूचना पढ़ी है और इन्हीं उद्देश्यों के लिए उसकी जानकारी लेने की सहमति देता/देती हूँ। मैं यह सहमति कभी भी वापस ले सकता/सकती हूँ।"
      />
    </StepFrame>
  );
}
