import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUESTION_TYPES, type Campaign, type CampaignStatus } from '@sajag/shared';
import { useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePublicConfig } from '../../../components/layout/PublicLayout';
import { Button } from '../../../components/ui/Button';
import { ErrorNotice, Loading, Notice } from '../../../components/ui/Feedback';
import { adminApi, queryKeys } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { QUESTION_TYPE_LABEL, STATUS_LABEL, pad2 } from '../../../lib/labels';
import { builderReducer } from './builder-state';
import { DataPolicyPanel } from './DataPolicyPanel';
import { blankCampaign, validationIssues } from './question-ops';
import { QuestionEditor } from './QuestionEditor';
import { QuestionPreview } from './QuestionPreview';
import { SettingsPanel } from './SettingsPanel';
import { SharePanel } from './SharePanel';

type Tab = 'questions' | 'settings' | 'data' | 'share';
const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'questions', label: 'प्रश्न' },
  { id: 'settings', label: 'सेटिंग्स' },
  { id: 'data', label: 'डेटा एवं सहमति' },
  { id: 'share', label: 'साझा करें' },
];

export function BuilderPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const { data: config } = usePublicConfig();
  const [tab, setTab] = useState<Tab>('questions');
  const [state, dispatch] = useReducer(builderReducer, { draft: blankCampaign(), active: 0, dirty: false });

  const existing = useQuery({ queryKey: queryKeys.adminCampaign(id ?? 'new'), queryFn: () => adminApi.campaign(id ?? ''), enabled: !isNew });
  useEffect(() => {
    if (existing.data) {
      const { title, summary, organizer, tags, settings, dataPolicy, questions } = existing.data;
      dispatch({ type: 'load', draft: { title, summary, organizer, tags, settings, dataPolicy, questions } });
    }
  }, [existing.data]);

  const issues = useMemo(() => validationIssues(state.draft), [state.draft]);
  const onSaved = (campaign: Campaign) => {
    dispatch({ type: 'saved' });
    queryClient.setQueryData(queryKeys.adminCampaign(campaign.id), campaign);
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminCampaigns });
    if (isNew) navigate(`/admin/campaigns/${campaign.id}`, { replace: true });
  };
  const save = useMutation({
    mutationFn: () => (isNew ? adminApi.createCampaign(state.draft) : adminApi.updateCampaign(id, state.draft)),
    onSuccess: onSaved,
  });
  const setStatus = useMutation({
    mutationFn: async (status: CampaignStatus) => {
      if (!id) throw new Error('पहले सहेजें');
      if (state.dirty) await adminApi.updateCampaign(id, state.draft);
      return adminApi.setStatus(id, status);
    },
    onSuccess: (campaign) => {
      onSaved(campaign);
      if (campaign.status === 'live') setTab('share');
    },
  });

  if (!isNew && existing.isLoading) return <Loading />;
  if (existing.error) return <ErrorNotice error={existing.error} />;

  const campaign = existing.data;
  const status = campaign?.status ?? 'draft';
  const canEdit = session.can('owner', 'author');
  const question = state.draft.questions[state.active];
  const total = state.draft.questions.length;

  return (
    <div className="builder stack-md">
      <div className="builder__head">
        <div className="stack-xs builder__title">
          <span className="eyebrow">
            {STATUS_LABEL[status]}
            {state.dirty && ' · बिना सहेजे बदलाव'}
          </span>
          <input
            className="title-input"
            aria-label="अभियान का नाम"
            value={state.draft.title}
            onChange={(e) => dispatch({ type: 'meta', patch: { title: e.target.value } })}
          />
        </div>
        <div className="row-wrap">
          <Button variant="ghost" onClick={() => save.mutate()} disabled={!canEdit || issues.length > 0 || !state.dirty} loading={save.isPending}>
            सहेजें
          </Button>
          {session.can('owner') && !isNew && status !== 'live' && (
            <Button onClick={() => setStatus.mutate('live')} disabled={issues.length > 0} loading={setStatus.isPending}>
              प्रकाशित करें
            </Button>
          )}
          {session.can('owner') && status === 'live' && (
            <Button variant="ghost" onClick={() => setStatus.mutate('closed')} loading={setStatus.isPending}>
              अभियान बंद करें
            </Button>
          )}
        </div>
      </div>

      <nav className="tabs" aria-label="बिल्डर खंड">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={`tabs__tab${tab === t.id ? ' is-active' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {save.error && <ErrorNotice error={save.error} />}
      {setStatus.error && <ErrorNotice error={setStatus.error} />}
      {issues.length > 0 && tab !== 'share' && (
        <Notice tone="warn" title="सहेजने से पहले ठीक करें">
          <ul className="plain-list">
            {issues.slice(0, 5).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Notice>
      )}

      {tab === 'questions' && question && (
        <div className="builder__grid">
          <aside className="outline" aria-label="प्रश्न सूची">
            <span className="mono muted">{total} प्रश्न</span>
            <div className="outline__list">
              {state.draft.questions.map((q, i) => (
                <button key={q.id} type="button" className={`outline__item${i === state.active ? ' is-active' : ''}`} onClick={() => dispatch({ type: 'select', index: i })}>
                  <span className="mono accent">{pad2(i + 1)}</span>
                  <span className="stack-xs">
                    <span className="clamp-2">{q.text || 'नया प्रश्न'}</span>
                    <span className="muted small">{QUESTION_TYPE_LABEL[q.type]}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="chips">
              {QUESTION_TYPES.map((type) => (
                <button key={type} type="button" className="chip" onClick={() => dispatch({ type: 'add', questionType: type })}>
                  + {QUESTION_TYPE_LABEL[type]}
                </button>
              ))}
            </div>
          </aside>
          <QuestionEditor
            question={question}
            index={state.active}
            total={total}
            onChange={(q) => dispatch({ type: 'question', index: state.active, question: q })}
            onDuplicate={() => dispatch({ type: 'duplicate', index: state.active })}
            onRemove={() => dispatch({ type: 'remove', index: state.active })}
            onMove={(by) => dispatch({ type: 'move', index: state.active, by })}
          />
          <QuestionPreview question={question} index={state.active} total={total} />
        </div>
      )}
      {tab === 'settings' && (
        <SettingsPanel draft={state.draft} onMeta={(patch) => dispatch({ type: 'meta', patch })} onSettings={(patch) => dispatch({ type: 'settings', patch })} />
      )}
      {tab === 'data' && (
        <DataPolicyPanel
          policy={state.draft.dataPolicy}
          digilockerEnabled={config?.digilockerEnabled ?? false}
          onField={(key, patch) => dispatch({ type: 'field', key, patch })}
          onPolicy={(patch) => dispatch({ type: 'policy', patch })}
        />
      )}
      {tab === 'share' && <SharePanel campaign={campaign} />}
    </div>
  );
}
