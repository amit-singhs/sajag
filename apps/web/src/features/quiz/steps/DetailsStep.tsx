import { INDIAN_MOBILE_REGEX, OPTIONAL_PERSONAL_FIELDS, normalizeMobileInput, type AgeBand, type PublicCampaign } from '@sajag/shared';
import { Button } from '../../../components/ui/Button';
import { ChoiceButton } from '../../../components/ui/Choice';
import { Notice } from '../../../components/ui/Feedback';
import { TextField } from '../../../components/ui/Field';
import { FIELD_LABEL } from '../../../lib/labels';
import type { ParticipantDraft } from '../quiz-state';
import { StepFrame } from './StepFrame';

interface DetailsStepProps {
  campaign: PublicCampaign;
  participant: ParticipantDraft;
  onChange: (patch: Partial<ParticipantDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}

const AGE_OPTIONS: ReadonlyArray<{ value: AgeBand; label: string }> = [
  { value: 'adult', label: '18 वर्ष या अधिक' },
  { value: 'minor', label: '18 वर्ष से कम' },
];

export function DetailsStep({ campaign, participant, onChange, onBack, onNext }: DetailsStepProps) {
  const { fields, minors } = campaign.dataPolicy;
  const activeFields = OPTIONAL_PERSONAL_FIELDS.filter((k) => fields[k].collect);
  const mobileValid = INDIAN_MOBILE_REGEX.test(participant.mobile);
  const minorBlocked = participant.ageBand === 'minor' && minors === 'disallow';
  const requiredFilled = activeFields.every((k) => !fields[k].required || participant[k].trim().length > 1);
  const canContinue = mobileValid && participant.ageBand !== null && !minorBlocked && requiredFilled;
  const isMinor = participant.ageBand === 'minor';

  return (
    <StepFrame
      eyebrow="चरण 2 · आपकी जानकारी"
      title="आपके बारे में"
      footer={
        <div className="row-between">
          <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
            पीछे
          </Button>
          <Button iconAfter="arrowRight" disabled={!canContinue} onClick={onNext}>
            {isMinor ? 'अभिभावक की सहमति लें' : 'प्रश्न शुरू करें'}
          </Button>
        </div>
      }
    >
      <fieldset className="fieldset stack-sm">
        <legend className="field__label">आपकी आयु</legend>
        <div className="grid-2">
          {AGE_OPTIONS.map((o) => (
            <ChoiceButton key={o.value} kind="radio" selected={participant.ageBand === o.value} onSelect={() => onChange({ ageBand: o.value })}>
              {o.label}
            </ChoiceButton>
          ))}
        </div>
        {minorBlocked && <Notice tone="warn">यह अभियान केवल 18 वर्ष या अधिक आयु के लोगों के लिए है।</Notice>}
        {isMinor && !minorBlocked && <Notice>अगले चरण में आपके माता-पिता या अभिभावक की सहमति ली जाएगी। उन्हें पास रखें।</Notice>}
      </fieldset>
      <TextField
        label="मोबाइल नंबर"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="10 अंक"
        value={participant.mobile}
        onChange={(e) => onChange({ mobile: normalizeMobileInput(e.target.value) })}
        error={participant.mobile.length === 10 && !mobileValid ? 'कृपया सही मोबाइल नंबर दर्ज करें' : undefined}
        hint={campaign.settings.onePerMobile ? 'एक मोबाइल नंबर से एक ही प्रविष्टि।' : undefined}
      />
      <div className="grid-2">
        {activeFields.map((key) => (
          <TextField
            key={key}
            label={`${FIELD_LABEL[key]}${fields[key].required ? '' : ' (वैकल्पिक)'}`}
            autoComplete={key === 'name' ? 'name' : 'off'}
            value={participant[key]}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        ))}
      </div>
      <p className="muted">हम पता या कोई पहचान-पत्र नहीं माँगते।</p>
    </StepFrame>
  );
}
