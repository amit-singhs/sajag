import {
  GUARDIAN_METHODS,
  MAX_RETENTION_DAYS,
  MIN_RETENTION_DAYS,
  OPTIONAL_PERSONAL_FIELDS,
  type DataPolicy,
  type FieldPolicy,
  type GuardianMethod,
  type MinorPolicy,
  type OptionalPersonalField,
} from '@sajag/shared';
import { Segmented } from '../../../components/ui/Choice';
import { Notice } from '../../../components/ui/Feedback';
import { Checkbox, TextField } from '../../../components/ui/Field';
import { FIELD_LABEL } from '../../../lib/labels';
import { SettingRow } from './SettingsPanel';

interface DataPolicyPanelProps {
  policy: DataPolicy;
  digilockerEnabled: boolean;
  onField: (key: OptionalPersonalField, patch: Partial<FieldPolicy>) => void;
  onPolicy: (patch: Partial<Omit<DataPolicy, 'fields'>>) => void;
}

const MINOR_OPTIONS: ReadonlyArray<{ value: MinorPolicy; label: string }> = [
  { value: 'disallow', label: 'अनुमति नहीं (केवल 18+)' },
  { value: 'guardian', label: 'अभिभावक की सत्यापित सहमति से' },
];
const METHOD_LABEL: Record<GuardianMethod, string> = {
  declaration: 'अभिभावक की घोषणा + मोबाइल नंबर',
  otp: 'अभिभावक के मोबाइल पर OTP',
  digilocker: 'DigiLocker से आयु व पहचान सत्यापन',
};
/** Only declaration is live for now; verified methods will be switched on later. */
const AVAILABLE_METHODS: ReadonlySet<GuardianMethod> = new Set(['declaration']);

export function DataPolicyPanel({ policy, digilockerEnabled, onField, onPolicy }: DataPolicyPanelProps) {
  const available = (m: GuardianMethod) => AVAILABLE_METHODS.has(m) || (m === 'digilocker' && digilockerEnabled);
  const toggleMethod = (method: GuardianMethod, on: boolean) =>
    onPolicy({ guardianMethods: on ? [...new Set([...policy.guardianMethods, method])] : policy.guardianMethods.filter((m) => m !== method) });

  return (
    <div className="stack-lg narrow-panel">
      <section className="card stack-md">
        <h2 className="title-2">कौन-सी व्यक्तिगत जानकारी लें</h2>
        <p className="muted">DPDP अधिनियम (धारा 6) के अनुसार केवल उतनी जानकारी लें जितनी उद्देश्य के लिए ज़रूरी है। मोबाइल और आयु वर्ग हमेशा लिए जाते हैं।</p>
        {OPTIONAL_PERSONAL_FIELDS.map((key) => {
          const field = policy.fields[key];
          return (
            <div key={key} className="policy-field">
              <div className="row-wrap">
                <Checkbox label={FIELD_LABEL[key]} checked={field.collect} onChange={(collect) => onField(key, { collect, required: collect && field.required })} />
                <Checkbox label="अनिवार्य" checked={field.required} disabled={!field.collect} onChange={(required) => onField(key, { required })} />
              </div>
              {field.collect && (
                <TextField label="उद्देश्य (प्रतिभागी को दिखेगा)" value={field.purpose} maxLength={200} onChange={(e) => onField(key, { purpose: e.target.value })} />
              )}
            </div>
          );
        })}
      </section>

      <section className="card stack-md">
        <h2 className="title-2">18 वर्ष से कम आयु के प्रतिभागी</h2>
        <Segmented label="नाबालिग नीति" value={policy.minors} options={MINOR_OPTIONS} onChange={(minors) => onPolicy({ minors })} />
        {policy.minors === 'guardian' && (
          <>
            {GUARDIAN_METHODS.map((m) => (
              <Checkbox
                key={m}
                label={`${METHOD_LABEL[m]}${available(m) ? '' : ' (अभी उपलब्ध नहीं)'}`}
                checked={policy.guardianMethods.includes(m)}
                disabled={!available(m)}
                onChange={(on) => toggleMethod(m, on)}
              />
            ))}
            <Notice>नाबालिगों के लिए अपने-आप लागू: कोई ट्रैकिंग या प्रचार नहीं, विश्लेषण में नाम छिपे, CSV निर्यात से बाहर।</Notice>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="title-2">प्रतिधारण</h2>
        <SettingRow title="व्यक्तिगत जानकारी कब मिटे" hint="अभियान समाप्ति (या प्रविष्टि) के इतने दिन बाद अपने-आप मिटेगी">
          <TextField
            label="दिन"
            type="number"
            min={MIN_RETENTION_DAYS}
            max={MAX_RETENTION_DAYS}
            value={policy.retentionDays}
            onChange={(e) => onPolicy({ retentionDays: Number.parseInt(e.target.value || '0', 10) || MIN_RETENTION_DAYS })}
          />
        </SettingRow>
        <SettingRow title="सूचना संस्करण" hint="सूचना के शब्द बदलने पर संस्करण बढ़ाएँ">
          <TextField label="संस्करण" value={policy.noticeVersion} maxLength={20} onChange={(e) => onPolicy({ noticeVersion: e.target.value })} />
        </SettingRow>
      </section>
    </div>
  );
}
