import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminConsentView, AuditEntry, DataRequestStatus, DataRequestView } from '@sajag/shared';
import { useState } from 'react';
import { PageHeader } from '../../../components/layout/AdminLayout';
import { usePublicConfig } from '../../../components/layout/PublicLayout';
import { Button } from '../../../components/ui/Button';
import { Stat } from '../../../components/ui/Charts';
import { QueryTable, type Column } from '../../../components/ui/DataTable';
import { ErrorNotice, Loading, Notice } from '../../../components/ui/Feedback';
import { Icon } from '../../../components/ui/Icon';
import { adminApi, queryKeys } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { CONSENT_METHOD_LABEL, REQUEST_STATUS_LABEL, REQUEST_TYPE_LABEL, formatDate, formatDateTime } from '../../../lib/labels';

function ResolveRequest({ request }: { request: DataRequestView }) {
  const queryClient = useQueryClient();
  const [response, setResponse] = useState(request.response ?? '');
  const resolve = useMutation({
    mutationFn: (status: Exclude<DataRequestStatus, 'open'>) => adminApi.resolveRequest(request.id, { status, response }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.privacyRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.privacySummary });
    },
  });
  if (request.status === 'resolved' || request.status === 'rejected') return <span className="muted">{request.response || '—'}</span>;
  return (
    <div className="stack-xs resolve">
      <input className="input" aria-label="उत्तर" placeholder="उत्तर / की गई कार्रवाई" value={response} onChange={(e) => setResponse(e.target.value)} />
      <div className="row-tight">
        <Button size="sm" onClick={() => resolve.mutate('resolved')} loading={resolve.isPending}>
          पूर्ण
        </Button>
        <Button size="sm" variant="ghost" onClick={() => resolve.mutate('rejected')}>
          अस्वीकार
        </Button>
      </div>
      {resolve.error && <ErrorNotice error={resolve.error} />}
    </div>
  );
}

const REQUEST_COLUMNS: ReadonlyArray<Column<DataRequestView>> = [
  { key: 'type', header: 'प्रकार', render: (r) => <strong>{REQUEST_TYPE_LABEL[r.type]}</strong> },
  { key: 'mobile', header: 'मोबाइल', render: (r) => r.mobileMasked, mono: true },
  { key: 'details', header: 'विवरण', render: (r) => <span className="clamp-2">{r.details ?? '—'}</span> },
  { key: 'due', header: 'अंतिम तिथि', render: (r) => formatDate(r.dueAt), mono: true },
  {
    key: 'status',
    header: 'स्थिति',
    render: (r) => <span className={`pill${r.overdue ? ' pill--due' : ''}`}>{r.overdue ? 'समय पार' : REQUEST_STATUS_LABEL[r.status]}</span>,
  },
  { key: 'action', header: 'कार्रवाई', render: (r) => <ResolveRequest request={r} /> },
];

const CONSENT_COLUMNS: ReadonlyArray<Column<AdminConsentView>> = [
  { key: 'time', header: 'समय', render: (c) => formatDateTime(c.grantedAt), mono: true },
  { key: 'mobile', header: 'मोबाइल', render: (c) => c.mobileMasked, mono: true },
  { key: 'notice', header: 'सूचना', render: (c) => `v${c.noticeVersion} · ${c.language}`, mono: true },
  { key: 'method', header: 'तरीका', render: (c) => CONSENT_METHOD_LABEL[c.method] },
  { key: 'state', header: 'स्थिति', render: (c) => (c.withdrawnAt ? 'वापस ली गई' : 'सक्रिय') },
];

const AUDIT_COLUMNS: ReadonlyArray<Column<AuditEntry>> = [
  { key: 'at', header: 'समय', render: (a) => formatDateTime(a.at), mono: true },
  { key: 'actor', header: 'कर्ता', render: (a) => a.actorName ?? 'सिस्टम / प्रतिभागी' },
  { key: 'action', header: 'कार्य', render: (a) => a.action, mono: true },
  { key: 'meta', header: 'विवरण', render: (a) => <span className="clamp-2 mono small">{a.meta ?? ''}</span> },
];

function ComplianceChecklist({ grievanceSet }: { grievanceSet: boolean }) {
  const items = [
    { ok: true, title: 'स्पष्ट, अलग सूचना', ref: 'धारा 5 · नियम 3' },
    { ok: true, title: 'स्वतंत्र, विशिष्ट सहमति और उसका रिकॉर्ड', ref: 'धारा 6' },
    { ok: true, title: 'न्यूनतम डेटा — हर फ़ील्ड का उद्देश्य', ref: 'धारा 6(1)' },
    { ok: true, title: 'नाबालिग: अभिभावक की सहमति (घोषणा + मोबाइल), कोई ट्रैकिंग नहीं', ref: 'धारा 9' },
    { ok: false, title: 'अभिभावक की पहचान का सत्यापन (OTP / DigiLocker) — अभी लंबित', ref: 'नियम 10 · मई 2027 से पहले' },
    { ok: true, title: 'अधिकार: देखना, सुधारना, मिटाना, सहमति वापसी, नामांकन', ref: 'धारा 11–14' },
    { ok: true, title: 'प्रतिधारण, 48 घंटे पूर्व सूचना, स्वतः मिटाना', ref: 'धारा 8(7) · नियम 8' },
    { ok: true, title: 'एन्क्रिप्शन, भूमिका-आधारित पहुँच, ऑडिट लॉग', ref: 'धारा 8(5) · नियम 6' },
    { ok: grievanceSet, title: 'शिकायत अधिकारी का संपर्क प्रकाशित', ref: 'धारा 8(9) · नियम 9' },
  ];
  return (
    <section className="card stack-sm">
      <div className="row-between">
        <h2 className="title-3">अनुपालन स्थिति</h2>
        <span className="mono">
          {items.filter((i) => i.ok).length} / {items.length}
        </span>
      </div>
      <ul className="checklist">
        {items.map((i) => (
          <li key={i.title} className={i.ok ? 'is-ok' : 'is-todo'}>
            <span className="checklist__tick">{i.ok && <Icon name="check" size={12} strokeWidth={3.5} />}</span>
            <span className="stack-xs">
              <strong>{i.title}</strong>
              <span className="muted small">{i.ref}</span>
            </span>
          </li>
        ))}
      </ul>
      {!grievanceSet && <Notice tone="warn">API के env में GRIEVANCE_OFFICER_NAME / EMAIL / PHONE भरें।</Notice>}
    </section>
  );
}

export function PrivacyPage() {
  const session = useAdminSession();
  const isOwner = session.can('owner');
  const { data: config } = usePublicConfig();
  const summary = useQuery({ queryKey: queryKeys.privacySummary, queryFn: adminApi.privacySummary });
  const requests = useQuery({ queryKey: queryKeys.privacyRequests, queryFn: adminApi.requests, enabled: isOwner });
  const consents = useQuery({ queryKey: queryKeys.privacyConsents, queryFn: adminApi.consents, enabled: isOwner });
  const audit = useQuery({ queryKey: queryKeys.privacyAudit, queryFn: adminApi.audit, enabled: isOwner });
  const s = summary.data;

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="DPDP अधिनियम 2023 · DPDP नियम 2025" title="डेटा एवं गोपनीयता" />
      <Notice>DPDP नियमों के मुख्य दायित्व मई 2027 से लागू होंगे; सजग इन्हें पहले दिन से लागू करता है। अंतिम रूप देने से पहले विधि विशेषज्ञ से समीक्षा कराएँ।</Notice>
      {summary.isLoading && <Loading />}
      {summary.error && <ErrorNotice error={summary.error} />}
      {s && (
        <div className="grid-auto grid-auto--stats">
          <Stat label="खुले अनुरोध" value={s.openRequests} note={`${s.overdueRequests} समय पार`} />
          <Stat label="सक्रिय सहमतियाँ" value={s.activeConsents} note={`${s.withdrawnConsents} वापस ली गईं`} />
          <Stat label="अभिभावक-सत्यापित नाबालिग" value={s.minorsVerified} />
          <Stat label="निर्धारित मिटाना" value={s.scheduledErasures} note="प्रतिधारण अवधि पूरी होने पर" />
        </div>
      )}
      <ComplianceChecklist grievanceSet={Boolean(config?.grievanceOfficer.email)} />
      {isOwner && (
        <>
          <section className="card stack-md">
            <h2 className="title-3">अधिकार अनुरोध और शिकायतें</h2>
            <QueryTable query={requests} columns={REQUEST_COLUMNS} rowKey={(r) => r.id} caption="अधिकार अनुरोध" />
          </section>
          <div className="grid-auto">
            <section className="card stack-md">
              <h2 className="title-3">सहमति रिकॉर्ड</h2>
              <QueryTable query={consents} columns={CONSENT_COLUMNS} rowKey={(c) => c.id} caption="सहमति रिकॉर्ड" />
            </section>
            <section className="card stack-md">
              <h2 className="title-3">ऑडिट लॉग</h2>
              <QueryTable query={audit} columns={AUDIT_COLUMNS} rowKey={(a) => a.id} caption="ऑडिट लॉग" />
            </section>
          </div>
        </>
      )}
      <section className="card stack-sm">
        <h2 className="title-3">डेटा उल्लंघन होने पर</h2>
        <ol className="steps steps--compact">
          <li className="steps__item"><span className="steps__num">01 · तुरंत</span>प्रभावित पहुँच रोकें, पासवर्ड व कुंजियाँ बदलें, घटना दर्ज करें।</li>
          <li className="steps__item"><span className="steps__num">02 · बिना देरी</span>डेटा संरक्षण बोर्ड और हर प्रभावित व्यक्ति को सरल भाषा में सूचना।</li>
          <li className="steps__item"><span className="steps__num">03 · 72 घंटे में</span>बोर्ड को विस्तृत रिपोर्ट: कारण, प्रभाव, उठाए गए कदम।</li>
        </ol>
      </section>
    </div>
  );
}
