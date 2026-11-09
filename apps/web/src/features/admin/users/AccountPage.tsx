import { useMutation } from '@tanstack/react-query';
import { MIN_PASSWORD_LENGTH } from '@sajag/shared';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { ErrorNotice, Notice } from '../../../components/ui/Feedback';
import { PasswordField } from '../../../components/ui/Field';
import { adminApi } from '../../../lib/api/endpoints';
import { useAdminSession } from '../../../lib/auth/useAdminSession';
import { ROLE_LABEL } from '../../../lib/labels';

export function AccountPage() {
  const { profile } = useAdminSession();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const change = useMutation({
    mutationFn: () => adminApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrent('');
      setNew('');
      setConfirm('');
    },
  });
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const canSubmit = currentPassword.length > 0 && newPassword.length >= MIN_PASSWORD_LENGTH && confirm === newPassword;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) change.mutate();
  };

  return (
    <div className="stack-lg narrow-panel">
      <PageHeader eyebrow={profile ? `${profile.email} · ${ROLE_LABEL[profile.role]}` : undefined} title="मेरा खाता" />
      <form className="card stack-md" onSubmit={onSubmit}>
        <h2 className="title-3">पासवर्ड बदलें</h2>
        <PasswordField label="वर्तमान पासवर्ड" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        <PasswordField
          label="नया पासवर्ड"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          hint={`कम से कम ${MIN_PASSWORD_LENGTH} अक्षर`}
        />
        <PasswordField
          label="नया पासवर्ड दोबारा"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'दोनों पासवर्ड एक जैसे नहीं हैं' : undefined}
        />
        {change.error && <ErrorNotice error={change.error} />}
        {change.isSuccess && <Notice tone="success">पासवर्ड बदल दिया गया।</Notice>}
        <Button type="submit" disabled={!canSubmit} loading={change.isPending}>
          पासवर्ड बदलें
        </Button>
      </form>
    </div>
  );
}
