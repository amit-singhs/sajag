import type { ReactNode } from 'react';
import { errorMessage } from '../../lib/api/client';
import { Icon } from './Icon';

export function Notice({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'error' | 'success'; title?: string; children?: ReactNode }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {tone !== 'info' && <Icon name={tone === 'success' ? 'check' : 'alert'} />}
      <div>
        {title && <strong className="notice__title">{title}</strong>}
        {children}
      </div>
    </div>
  );
}

export function ErrorNotice({ error }: { error: unknown }) {
  return <Notice tone="error">{errorMessage(error)}</Notice>;
}

export function Loading({ label = 'लोड हो रहा है…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="loading__dot" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function SampleBadge() {
  return <span className="badge">नमूना</span>;
}
