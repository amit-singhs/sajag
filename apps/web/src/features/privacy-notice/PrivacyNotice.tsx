import { OPTIONAL_PERSONAL_FIELDS, type DataPolicy } from '@sajag/shared';
import { Link } from 'react-router-dom';
import { usePublicConfig } from '../../components/layout/PublicLayout';
import { FIELD_LABEL } from '../../lib/labels';

/**
 * Itemised notice (DPDP Act s.5, Rules r.3): what is collected, why, for how long, and how to exercise rights.
 * Generated from the campaign's own data policy so the notice can never drift from what is actually collected.
 */
export function PrivacyNotice({ policy }: { policy: DataPolicy }) {
  const { data: config } = usePublicConfig();
  const officer = config?.grievanceOfficer;
  const items = [
    { label: 'मोबाइल नंबर', purpose: 'एक व्यक्ति, एक प्रविष्टि; आपके डेटा अनुरोधों पर संपर्क के लिए' },
    ...OPTIONAL_PERSONAL_FIELDS.filter((k) => policy.fields[k].collect).map((k) => ({ label: FIELD_LABEL[k], purpose: policy.fields[k].purpose })),
    { label: 'आयु वर्ग', purpose: '18 से कम होने पर अभिभावक की सहमति लेने के लिए' },
    ...(policy.minors === 'guardian'
      ? [{ label: 'अभिभावक का नाम व मोबाइल', purpose: 'केवल 18 से कम आयु पर — अभिभावक की सहमति का रिकॉर्ड' }]
      : []),
    { label: 'आपके उत्तर', purpose: 'आपका स्कोर बताने और प्रश्न-वार भ्रम समझने के लिए (समेकित)' },
  ];
  return (
    <div className="stack-md">
      <dl className="notice-list">
        {items.map((i) => (
          <div key={i.label} className="notice-list__row">
            <dt>{i.label}</dt>
            <dd>{i.purpose}</dd>
          </div>
        ))}
      </dl>
      <div className="callout stack-sm">
        <p>
          <strong>कब तक:</strong> अभियान समाप्ति के {policy.retentionDays} दिन बाद आपकी व्यक्तिगत जानकारी अपने-आप मिटा दी जाएगी।
        </p>
        <p>
          <strong>कभी नहीं:</strong> बेचना, विज्ञापन, ट्रैकिंग या किसी और उद्देश्य के लिए उपयोग।
        </p>
        <p>
          <strong>आपके अधिकार:</strong> अपनी जानकारी जानना, सुधारना, मिटवाना, सहमति वापस लेना और नामांकित व्यक्ति चुनना — <Link to="/my-data">मेरा डेटा</Link> पर अपने मोबाइल नंबर से अनुरोध भेजें।
        </p>
        <p>
          <strong>शिकायत अधिकारी:</strong> {[officer?.name, officer?.email, officer?.phone].filter(Boolean).join(', ') || '—'}। संतुष्ट न हों तो
          भारत के डेटा संरक्षण बोर्ड में शिकायत कर सकते हैं।
        </p>
        <p className="muted">सूचना संस्करण {policy.noticeVersion}</p>
      </div>
    </div>
  );
}
