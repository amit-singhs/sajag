import { RESULTS_VISIBILITY, type CampaignInput, type CampaignLanguage, type CampaignSettings } from '@sajag/shared';
import type { ReactNode } from 'react';
import { Checkbox, SelectField, TextArea, TextField } from '../../../components/ui/Field';
import { RESULTS_VISIBILITY_LABEL } from '../../../lib/labels';

interface SettingsPanelProps {
  draft: CampaignInput;
  onMeta: (patch: Partial<Pick<CampaignInput, 'summary' | 'organizer' | 'tags'>>) => void;
  onSettings: (patch: Partial<CampaignSettings>) => void;
}

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: CampaignLanguage; label: string }> = [
  { value: 'hi', label: 'हिंदी' },
  { value: 'en', label: 'English' },
  { value: 'hi_en', label: 'हिंदी + English' },
];

export function SettingRow({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="setting-row">
      <div className="stack-xs">
        <strong>{title}</strong>
        {hint && <span className="muted">{hint}</span>}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  );
}

export function SettingsPanel({ draft, onMeta, onSettings }: SettingsPanelProps) {
  const s = draft.settings;
  return (
    <div className="stack-lg narrow-panel">
      <section className="card stack-md">
        <h2 className="title-2">अभियान का विवरण</h2>
        <TextArea label="सारांश (मुखपृष्ठ कार्ड पर)" value={draft.summary} maxLength={600} onChange={(e) => onMeta({ summary: e.target.value })} />
        <div className="grid-2">
          <TextField label="प्रेरक / आयोजक" value={draft.organizer} onChange={(e) => onMeta({ organizer: e.target.value })} />
          <TextField
            label="टैग (अल्पविराम से अलग)"
            value={draft.tags.join(', ')}
            onChange={(e) => onMeta({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8) })}
          />
        </div>
      </section>
      <section className="card">
        <h2 className="title-2">सेटिंग्स</h2>
        <SettingRow title="अवधि" hint="इस अवधि के बाहर लिंक बंद रहेगा">
          <div className="row-wrap">
            <input className="input" type="datetime-local" aria-label="आरंभ" value={toLocalInput(s.startsAt)} onChange={(e) => onSettings({ startsAt: fromLocalInput(e.target.value) })} />
            <input className="input" type="datetime-local" aria-label="समाप्ति" value={toLocalInput(s.endsAt)} onChange={(e) => onSettings({ endsAt: fromLocalInput(e.target.value) })} />
          </div>
        </SettingRow>
        <SettingRow title="एक मोबाइल, एक प्रविष्टि">
          <Checkbox label="चालू" checked={s.onePerMobile} onChange={(onePerMobile) => onSettings({ onePerMobile })} />
        </SettingRow>
        <SettingRow title="परिणाम कब दिखें">
          <SelectField
            label="परिणाम"
            value={s.resultsVisibility}
            options={RESULTS_VISIBILITY.map((v) => ({ value: v, label: RESULTS_VISIBILITY_LABEL[v] }))}
            onChange={(resultsVisibility) => onSettings({ resultsVisibility })}
          />
        </SettingRow>
        <SettingRow title="व्याख्या दिखाएँ" hint="परिणाम के साथ हर प्रश्न का सही उत्तर और व्याख्या">
          <Checkbox label="चालू" checked={s.showExplanations} onChange={(showExplanations) => onSettings({ showExplanations })} />
        </SettingRow>
        <SettingRow title="प्रश्नों का क्रम बदलें" hint="हर प्रतिभागी को अलग क्रम">
          <Checkbox label="चालू" checked={s.shuffleQuestions} onChange={(shuffleQuestions) => onSettings({ shuffleQuestions })} />
        </SettingRow>
        <SettingRow title="भाषा">
          <SelectField label="भाषा" value={s.language} options={LANGUAGE_OPTIONS} onChange={(language) => onSettings({ language })} />
        </SettingRow>
      </section>
    </div>
  );
}
