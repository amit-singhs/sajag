import type { Campaign } from '@sajag/shared';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Notice } from '../../../components/ui/Feedback';

export function SharePanel({ campaign }: { campaign: Campaign | undefined }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!campaign) return <Notice>साझा करने के लिए पहले अभियान सहेजें।</Notice>;
  const url = `${window.location.origin}/c/${campaign.slug}`;
  const message = `${campaign.title} — कानूनी जागरूकता प्रश्नावली में भाग लें: ${url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = Object.assign(document.createElement('a'), { href: canvas.toDataURL('image/png'), download: `sajag-${campaign.slug}-qr.png` });
    a.click();
  };

  return (
    <div className="grid-auto">
      <section className="card stack-md">
        <h2 className="title-2">लिंक साझा करें</h2>
        {campaign.status !== 'live' && <Notice tone="warn">अभियान अभी {campaign.status === 'draft' ? 'ड्राफ़्ट' : 'बंद'} है — लिंक तभी काम करेगा जब यह प्रकाशित हो।</Notice>}
        <div className="row-end">
          <input className="input mono" readOnly value={url} aria-label="अभियान लिंक" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="ghost" icon="copy" onClick={() => void copy()}>
            {copied ? 'कॉपी हो गया' : 'कॉपी'}
          </Button>
        </div>
        <div className="row-wrap">
          <a className="btn btn--primary btn--md" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
            WhatsApp पर भेजें
          </a>
          <a className="btn btn--ghost btn--md" href={`sms:?&body=${encodeURIComponent(message)}`}>
            SMS
          </a>
        </div>
      </section>
      <section className="card stack-md">
        <h2 className="title-2">QR कोड</h2>
        <div ref={qrRef} className="qr">
          <QRCodeCanvas value={url} size={200} marginSize={2} fgColor="#141A2A" bgColor="#FFFFFF" />
        </div>
        <p className="muted">स्कूल, पंचायत भवन या सूचना पट पर लगाने के लिए।</p>
        <Button variant="ghost" icon="download" onClick={downloadQr}>
          QR डाउनलोड करें
        </Button>
      </section>
    </div>
  );
}
