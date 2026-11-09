import { useQuery } from '@tanstack/react-query';
import type { CampaignSummary } from '@sajag/shared';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layout/AdminLayout';
import { ButtonLink } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { ErrorNotice, Loading } from '../../../components/ui/Feedback';
import { adminApi, queryKeys } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { STATUS_LABEL, formatDate } from '../../../lib/labels';

const COLUMNS: ReadonlyArray<Column<CampaignSummary>> = [
  { key: 'title', header: 'अभियान', render: (c) => <Link to={`/admin/campaigns/${c.id}`}>{c.title}</Link> },
  { key: 'status', header: 'स्थिति', render: (c) => <span className={`pill pill--${c.status}`}>{STATUS_LABEL[c.status]}</span> },
  { key: 'questions', header: 'प्रश्न', render: (c) => c.questionCount, mono: true },
  { key: 'updated', header: 'अद्यतन', render: (c) => formatDate(c.updatedAt), mono: true },
  { key: 'open', header: '', align: 'end', render: (c) => <Link to={`/admin?campaign=${c.id}`}>विश्लेषण</Link> },
];

export function CampaignsPage() {
  const session = useAdminSession();
  const campaigns = useQuery({ queryKey: queryKeys.adminCampaigns, queryFn: adminApi.campaigns });
  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="फ़ॉर्म बिल्डर"
        title="अभियान व फ़ॉर्म"
        actions={
          session.can('owner', 'author') && (
            <ButtonLink to="/admin/campaigns/new" icon="plus">
              नया अभियान
            </ButtonLink>
          )
        }
      />
      {campaigns.isLoading && <Loading />}
      {campaigns.error && <ErrorNotice error={campaigns.error} />}
      {campaigns.data && (
        <div className="card">
          <DataTable columns={COLUMNS} rows={campaigns.data} rowKey={(c) => c.id} empty="अभी कोई अभियान नहीं — नया अभियान बनाएँ।" caption="अभियान सूची" />
        </div>
      )}
    </div>
  );
}
