import { DEFAULT_DATA_POLICY } from '@sajag/shared';
import { PrivacyNotice } from './PrivacyNotice';

export function PrivacyPolicyPage() {
  return (
    <section className="container narrow section stack-lg">
      <div className="stack-sm">
        <span className="eyebrow">गोपनीयता सूचना</span>
        <h1 className="display-2">आपकी जानकारी, आपका अधिकार</h1>
        <p className="lead">
          डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुसार। हर अभियान शुरू करने से पहले उस अभियान की अपनी सूचना दिखाई जाती है; नीचे सामान्य रूप है।
        </p>
      </div>
      <PrivacyNotice policy={DEFAULT_DATA_POLICY} />
    </section>
  );
}
