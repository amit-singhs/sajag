import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ROLES, MIN_PASSWORD_LENGTH, type AdminRole, type AdminUpdateInput, type AdminUserView } from '@sajag/shared';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { QueryTable, type Column } from '../../../components/ui/DataTable';
import { ErrorNotice, Notice } from '../../../components/ui/Feedback';
import { PasswordField, SelectField, TextField } from '../../../components/ui/Field';
import { adminApi, queryKeys } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { ROLE_LABEL, formatDateTime } from '../../../lib/labels';

const ROLE_OPTIONS = ADMIN_ROLES.map((value) => ({ value, label: ROLE_LABEL[value] }));
const ROLE_HELP: Record<AdminRole, string> = {
  owner: 'सब कुछ: अभियान, विश्लेषण, गोपनीयता अनुरोध, व्यवस्थापक खाते',
  analyst: 'केवल विश्लेषण देखना (नाम छिपे रहते हैं)',
  author: 'केवल फ़ॉर्म बिल्डर — प्रश्न बनाना और बदलना',
};

function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminUpdateInput }) => adminApi.updateUser(id, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  });
}

function CreateAdminForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('analyst');
  const [password, setPassword] = useState('');
  const create = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, role, password }),
    onSuccess: () => {
      setName('');
      setEmail('');
      setPassword('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
    },
  });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <form className="card stack-md" onSubmit={onSubmit}>
      <h2 className="title-3">नया व्यवस्थापक जोड़ें</h2>
      <div className="grid-2">
        <TextField label="नाम" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="ईमेल (लॉगिन यूज़रनेम)" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <SelectField<AdminRole> label="भूमिका" value={role} options={ROLE_OPTIONS} onChange={setRole} hint={ROLE_HELP[role]} />
        <PasswordField
          label="अस्थायी पासवर्ड"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={`कम से कम ${MIN_PASSWORD_LENGTH} अक्षर। यह पासवर्ड व्यक्ति को सुरक्षित रूप से दें — वे लॉगिन के बाद "मेरा खाता" में इसे बदल लें।`}
          required
        />
      </div>
      {create.error && <ErrorNotice error={create.error} />}
      {create.isSuccess && <Notice tone="success">व्यवस्थापक जोड़ दिया गया।</Notice>}
      <Button type="submit" icon="plus" loading={create.isPending} disabled={password.length < MIN_PASSWORD_LENGTH}>
        जोड़ें
      </Button>
    </form>
  );
}

function ResetPassword({ user }: { user: AdminUserView }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const update = useUpdateUser();
  if (!open)
    return (
      <Button size="sm" variant="ghost" icon="key" onClick={() => setOpen(true)}>
        पासवर्ड रीसेट
      </Button>
    );
  return (
    <div className="stack-xs resolve">
      <PasswordField label="नया पासवर्ड" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="row-tight">
        <Button
          size="sm"
          disabled={password.length < MIN_PASSWORD_LENGTH}
          loading={update.isPending}
          onClick={() => update.mutate({ id: user.id, body: { password } }, { onSuccess: () => setOpen(false) })}
        >
          सहेजें
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          रद्द
        </Button>
      </div>
      {update.error && <ErrorNotice error={update.error} />}
    </div>
  );
}

function UserActions({ user, isSelf }: { user: AdminUserView; isSelf: boolean }) {
  const update = useUpdateUser();
  return (
    <div className="stack-xs">
      <div className="row-tight">
        <select
          className="input input--compact"
          aria-label={`${user.name} की भूमिका`}
          value={user.role}
          onChange={(e) => update.mutate({ id: user.id, body: { role: e.target.value as AdminRole } })}
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!isSelf && (
          <Button size="sm" variant="ghost" loading={update.isPending} onClick={() => update.mutate({ id: user.id, body: { isActive: !user.isActive } })}>
            {user.isActive ? 'निष्क्रिय करें' : 'सक्रिय करें'}
          </Button>
        )}
      </div>
      <ResetPassword user={user} />
      {update.error && <ErrorNotice error={update.error} />}
    </div>
  );
}

export function AdminUsersPage() {
  const session = useAdminSession();
  const users = useQuery({ queryKey: queryKeys.adminUsers, queryFn: adminApi.users });
  const columns: ReadonlyArray<Column<AdminUserView>> = [
    {
      key: 'name',
      header: 'व्यवस्थापक',
      render: (u) => (
        <span className="stack-xs">
          <strong>
            {u.name}
            {u.id === session.profile?.id && ' (आप)'}
          </strong>
          <span className="muted small">{u.email}</span>
        </span>
      ),
    },
    { key: 'status', header: 'स्थिति', render: (u) => <span className={`pill${u.isActive ? ' pill--live' : ''}`}>{u.isActive ? 'सक्रिय' : 'निष्क्रिय'}</span> },
    { key: 'last', header: 'अंतिम लॉगिन', render: (u) => (u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'), mono: true },
    { key: 'actions', header: 'भूमिका व कार्रवाई', render: (u) => <UserActions user={u} isSelf={u.id === session.profile?.id} /> },
  ];

  return (
    <div className="stack-lg">
      <PageHeader eyebrow="केवल स्वामी" title="व्यवस्थापक खाते" />
      <Notice>हर व्यक्ति का अपना खाता बनाएँ — पासवर्ड साझा न करें। खाता निष्क्रिय करते ही उसकी पहुँच तुरंत बंद हो जाती है।</Notice>
      <CreateAdminForm />
      <section className="card stack-md">
        <h2 className="title-3">सभी व्यवस्थापक</h2>
        <QueryTable query={users} columns={columns} rowKey={(u) => u.id} caption="व्यवस्थापक खाते" />
      </section>
    </div>
  );
}
