import { useMutation, useQuery } from '@tanstack/react-query';
import type { CampaignAnalytics } from '@sajag/shared';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ColumnChart, Legend, MeterRow, Stat } from '../../../components/ui/Charts';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { EmptyState, ErrorNotice, Loading } from '../../../components/ui/Feedback';
import { SelectField, TextField } from '../../../components/ui/Field';
import { adminApi, queryKeys } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { formatDateTime, pad2 } from '../../../lib/labels';

type DistrictRow = CampaignAnalytics['districts'][number];
type RecentRow = CampaignAnalytics['recent'][number];

const DISTRICT_COLUMNS: ReadonlyArray<Column<DistrictRow>> = [
  { key: 'district', header: 'ज़िला', render: (d) => <strong>{d.district}</strong> },
  { key: 'tehsils', header: 'तहसीलें', render: (d) => d.tehsils, mono: true },
  { key: 'responses', header: 'प्रतिक्रियाएँ', render: (d) => d.responses.toLocaleString('en-IN'), mono: true },
  { key: 'avg', header: 'औसत अंक', render: (d) => d.averageScore, mono: true, align: 'end' },
];

const RECENT_COLUMNS: ReadonlyArray<Column<RecentRow>> = [
  { key: 'time', header: 'समय', render: (r) => formatDateTime(r.submittedAt), mono: true },
  { key: 'name', header: 'नाम', render: (r) => (r.isMinor ? <span className="muted">नाबालिग · छिपा</span> : (r.name ?? <span className="muted">छिपा</span>)) },
  { key: 'mobile', header: 'मोबाइल', render: (r) => r.mobileMasked, mono: true },
  { key: 'district', header: 'ज़िला', render: (r) => r.district ?? '—' },
  { key: 'score', header: 'अंक', render: (r) => r.score, mono: true, align: 'end' },
];

function ExportCsv({ campaignId }: { campaignId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const exportCsv = useMutation({
    mutationFn: () => adminApi.exportCsv(campaignId, reason),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: 'sajag-responses.csv' }).click();
      URL.revokeObjectURL(url);
      setOpen(false);
      setReason('');
    },
  });
  if (!open)
    return (
      <Button variant="ghost" icon="download" onClick={() => setOpen(true)}>
        CSV निर्यात
      </Button>
    );
  return (
    <div className="card stack-sm export-box">
      <TextField label="निर्यात का कारण (ऑडिट लॉग में दर्ज होगा)" value={reason} onChange={(e) => setReason(e.target.value)} hint="केवल वयस्कों की प्रविष्टियाँ, मोबाइल छिपे हुए।" />
      {exportCsv.error && <ErrorNotice error={exportCsv.error} />}
      <div className="row-wrap">
        <Button onClick={() => exportCsv.mutate()} disabled={reason.trim().length < 5} loading={exportCsv.isPending}>
          डाउनलोड
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          रद्द करें
        </Button>
      </div>
    </div>
  );
}

function AnalyticsView({ data }: { data: CampaignAnalytics }) {
  const { totals } = data;
  const lowest = [...data.questions].filter((q) => q.answered > 0).sort((a, b) => a.correctRate - b.correctRate).slice(0, 3).map((q) => q.questionId);
  const highFrom = Math.ceil(totals.maxScore * 0.8);

  if (totals.responses === 0) return <EmptyState title="अभी कोई प्रतिक्रिया नहीं">लिंक साझा करें — प्रतिक्रियाएँ आते ही यहाँ दिखेंगी।</EmptyState>;

  return (
    <div className="stack-lg">
      <div className="grid-auto grid-auto--stats">
        <Stat label="कुल प्रतिक्रियाएँ" value={totals.responses.toLocaleString('en-IN')} note={`पिछले 7 दिनों में ${totals.last7Days}`} />
        <Stat label="औसत अंक" value={totals.averageScore} unit={`/ ${totals.maxScore}`} note={`${totals.averagePercent}% सही`} />
        <Stat label={`${highFrom}+ अंक पाने वाले`} value={`${totals.highScorerShare}%`} note={`${totals.highScorerCount} प्रतिभागी`} />
        <Stat label="क्षेत्रीय पहुँच" value={totals.districts} unit="ज़िले" note={`${totals.tehsils} तहसीलें · ${totals.minors} नाबालिग`} />
      </div>

      <div className="grid-auto">
        <section className="card stack-md">
          <h2 className="title-3">प्रतिदिन प्रतिक्रियाएँ · पिछले 30 दिन</h2>
          <ColumnChart
            label="पिछले 30 दिनों की प्रतिदिन प्रतिक्रियाएँ"
            bars={data.daily.map((d) => ({ key: d.date, value: d.count, tip: `${d.date}: ${d.count}` }))}
            axis={
              <>
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily.at(-1)?.date}</span>
              </>
            }
          />
        </section>
        <section className="card stack-md">
          <h2 className="title-3">अंक वितरण</h2>
          <ColumnChart
            label="अंक वितरण"
            bars={data.scoreDistribution.map((d) => ({
              key: String(d.score),
              value: d.count,
              tone: d.score >= highFrom ? 'hot' : d.score < totals.maxScore * 0.6 ? 'soft' : 'base',
              tip: `${d.score} अंक: ${d.count}`,
            }))}
            axis={
              <>
                <span>0</span>
                <span>{totals.maxScore}</span>
              </>
            }
          />
          <Legend items={[{ tone: 'soft', label: '60% से कम' }, { tone: 'base', label: '60–79%' }, { tone: 'hot', label: '80%+' }]} />
        </section>
      </div>

      <section className="card stack-md">
        <div className="row-between">
          <div className="stack-xs">
            <h2 className="title-3">प्रश्न-वार सही उत्तर दर</h2>
            <p className="muted">जिन प्रश्नों में सबसे कम लोग सही उत्तर पहचान पाए, वहीं अगले जागरूकता सत्र की ज़रूरत है।</p>
          </div>
          <Legend items={[{ tone: 'hot', label: 'सबसे अधिक भ्रम (निचले 3)' }]} />
        </div>
        <div className="stack-xs">
          {data.questions.map((q) => (
            <MeterRow key={q.questionId} label={`Q${pad2(q.index)}`} sub={q.topic || q.text} percent={q.correctRate} hot={lowest.includes(q.questionId)} />
          ))}
        </div>
      </section>

      <div className="grid-auto">
        <section className="card stack-md">
          <h2 className="title-3">ज़िले-वार भागीदारी</h2>
          <DataTable columns={DISTRICT_COLUMNS} rows={data.districts} rowKey={(d) => d.district} caption="ज़िले-वार भागीदारी" />
        </section>
        <section className="card stack-md">
          <h2 className="title-3">हाल की प्रतिक्रियाएँ</h2>
          <DataTable columns={RECENT_COLUMNS} rows={data.recent} rowKey={(r) => `${r.submittedAt}-${r.mobileMasked}`} caption="हाल की प्रतिक्रियाएँ" />
        </section>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const session = useAdminSession();
  const [params, setParams] = useSearchParams();
  const campaigns = useQuery({ queryKey: queryKeys.adminCampaigns, queryFn: adminApi.campaigns });
  const selectedId = params.get('campaign') ?? campaigns.data?.find((c) => c.status === 'live')?.id ?? campaigns.data?.[0]?.id ?? '';
  const canAnalyse = session.can('owner', 'analyst');
  const analytics = useQuery({
    queryKey: queryKeys.analytics(selectedId),
    queryFn: () => adminApi.analytics(selectedId),
    enabled: Boolean(selectedId) && canAnalyse,
    refetchInterval: 60_000,
  });

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="अवलोकन"
        title="प्रतिक्रिया विश्लेषण"
        actions={
          <>
            {campaigns.data && campaigns.data.length > 0 && (
              <SelectField
                label="अभियान"
                value={selectedId}
                options={campaigns.data.map((c) => ({ value: c.id, label: c.title }))}
                onChange={(id) => setParams({ campaign: id })}
              />
            )}
            {selectedId && session.can('owner') && <ExportCsv campaignId={selectedId} />}
          </>
        }
      />
      {!canAnalyse && <EmptyState title="आपकी भूमिका में विश्लेषण उपलब्ध नहीं है">फ़ॉर्म बिल्डर पर जाएँ।</EmptyState>}
      {(campaigns.isLoading || analytics.isLoading) && <Loading />}
      {campaigns.error && <ErrorNotice error={campaigns.error} />}
      {analytics.error && <ErrorNotice error={analytics.error} />}
      {campaigns.data?.length === 0 && <EmptyState title="अभी कोई अभियान नहीं">पहला अभियान फ़ॉर्म बिल्डर से बनाएँ।</EmptyState>}
      {analytics.data && <AnalyticsView data={analytics.data} />}
    </div>
  );
}
