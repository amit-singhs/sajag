import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MANUAL_REQUEST_TYPES, type ManualRequestType, type MyDataView, type ParticipationView } from '@sajag/shared';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Segmented } from '../../components/ui/Choice';
import { ErrorNotice, Loading, Notice } from '../../components/ui/Feedback';
import { TextArea } from '../../components/ui/Field';
import { rightsApi, queryKeys } from '../../lib/api/endpoints';
import { CONSENT_METHOD_LABEL, REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, formatDate } from '../../lib/labels';
import { OtpVerifier } from '../otp/OtpVerifier';

function downloadJson(data: MyDataView) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'sajag-my-data.json' });
  a.click();
  URL.revokeObjectURL(url);
}

function ParticipationCard({ p }: { p: ParticipationView }) {
  const rows: Array<[string, string]> = [
    ['अभियान', p.campaignTitle],
    ['नाम', p.name ?? '—'],
    ['तहसील', p.tehsil ?? '—'],
    ['ज़िला', p.district ?? '—'],
    ['आयु वर्ग', p.ageBand === 'minor' ? '18 से कम' : '18+'],
    ['अंक', p.score === null ? '—' : `${p.score} / ${p.maxScore}`],
    ['सहमति', p.consent ? `${CONSENT_METHOD_LABEL[p.consent.method]} · सूचना v${p.consent.noticeVersion}` : '—'],
    ['मिटेगा', formatDate(p.scheduledErasureAt)],
  ];
  return (
    <div className="card">
      <dl className="kv">
        {rows.map(([k, v]) => (
          <div key={k} className="kv__row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RequestForm({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ManualRequestType>('correction');
  const [details, setDetails] = useState('');
  const file = useMutation({
    mutationFn: () => rightsApi.fileRequest(token, { type, details }),
    onSuccess: () => {
      setDetails('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.myData });
    },
  });
  return (
    <div className="card stack-md">
      <h2 className="title-3">सुधार, शिकायत या नामांकन</h2>
      <Segmented label="अनुरोध का प्रकार" value={type} onChange={setType} options={MANUAL_REQUEST_TYPES.map((v) => ({ value: v, label: REQUEST_TYPE_LABEL[v] }))} />
      <TextArea
        label="विवरण"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        hint={type === 'nomination' ? 'उस व्यक्ति का नाम और संबंध लिखें जो आपकी मृत्यु या अक्षमता पर आपके अधिकारों का उपयोग करेगा।' : undefined}
      />
      {file.error && <ErrorNotice error={file.error} />}
      {file.isSuccess && <Notice tone="success">अनुरोध दर्ज हो गया। 30 दिनों के भीतर उत्तर दिया जाएगा।</Notice>}
      <Button onClick={() => file.mutate()} disabled={details.trim().length < 5} loading={file.isPending}>
        अनुरोध भेजें
      </Button>
    </div>
  );
}

function WithdrawPanel({ token, onDone }: { token: string; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const withdraw = useMutation({ mutationFn: () => rightsApi.withdraw(token), onSuccess: onDone });
  return (
    <div className="card card--danger stack-sm">
      <h2 className="title-3">सहमति वापस लें और डेटा मिटवाएँ</h2>
      <p className="muted">आपकी व्यक्तिगत जानकारी तुरंत और स्थायी रूप से मिटा दी जाएगी; केवल बिना पहचान वाले आँकड़े रहेंगे।</p>
      {withdraw.error && <ErrorNotice error={withdraw.error} />}
      {confirming ? (
        <div className="row-wrap">
          <Button variant="danger" onClick={() => withdraw.mutate()} loading={withdraw.isPending}>
            हाँ, स्थायी रूप से मिटाएँ
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            रद्द करें
          </Button>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          मिटवाएँ
        </Button>
      )}
    </div>
  );
}

export function MyDataPage() {
  const [mobile, setMobile] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [erased, setErased] = useState(false);
  const myData = useQuery({ queryKey: [...queryKeys.myData, token], queryFn: () => rightsApi.me(token ?? ''), enabled: Boolean(token) });

  return (
    <section className="container narrow section stack-lg">
      <div className="stack-sm">
        <span className="eyebrow">मेरा डेटा</span>
        <h1 className="display-2">अपनी जानकारी देखें और नियंत्रित करें</h1>
        <p className="lead">जिस मोबाइल नंबर से आपने प्रश्नावली भरी थी, उस पर OTP भेजकर हम पुष्टि करेंगे कि यह आप ही हैं।</p>
      </div>

      {!token && <OtpVerifier purpose="data_rights" mobile={mobile} onMobileChange={setMobile} onVerified={setToken} />}
      {erased && <Notice tone="success" title="आपका डेटा मिटा दिया गया">आपकी सहमति वापस ले ली गई है।</Notice>}
      {token && myData.isLoading && <Loading />}
      {myData.error && <ErrorNotice error={myData.error} />}

      {token && myData.data && !erased && (
        <>
          {myData.data.participations.length === 0 ? (
            <Notice>इस मोबाइल नंबर से जुड़ी कोई जानकारी हमारे पास नहीं है।</Notice>
          ) : (
            <div className="stack-md">
              {myData.data.participations.map((p) => (
                <ParticipationCard key={p.participantId} p={p} />
              ))}
              <Button variant="ghost" icon="download" onClick={() => downloadJson(myData.data)}>
                पूरी जानकारी डाउनलोड करें
              </Button>
            </div>
          )}
          <RequestForm token={token} />
          {myData.data.requests.length > 0 && (
            <div className="card stack-sm">
              <h2 className="title-3">आपके अनुरोध</h2>
              <ul className="plain-list">
                {myData.data.requests.map((r) => (
                  <li key={r.id} className="row-between">
                    <span>
                      {REQUEST_TYPE_LABEL[r.type]} · {formatDate(r.createdAt)}
                    </span>
                    <span className="pill">{REQUEST_STATUS_LABEL[r.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {myData.data.participations.length > 0 && <WithdrawPanel token={token} onDone={() => setErased(true)} />}
        </>
      )}
      <p className="muted">शिकायत का समाधान न होने पर आप भारत के डेटा संरक्षण बोर्ड से संपर्क कर सकते हैं।</p>
    </section>
  );
}
