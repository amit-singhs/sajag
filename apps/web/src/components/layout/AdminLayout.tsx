import type { ReactNode } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminSession } from '../../lib/auth/useAdminSession';
import { ROLE_LABEL } from '../../lib/labels';
import { Button } from '../ui/Button';
import { ErrorNotice, Loading } from '../ui/Feedback';
import { Icon, type IconName } from '../ui/Icon';
import { Wordmark } from '../ui/Seal';
import { SystemStatus } from './SystemStatus';

const NAV: ReadonlyArray<{ to: string; label: string; icon: IconName; end?: boolean; ownerOnly?: boolean }> = [
  { to: '/admin', label: 'अवलोकन', icon: 'grid', end: true },
  { to: '/admin/campaigns', label: 'अभियान व फ़ॉर्म', icon: 'list' },
  { to: '/admin/privacy', label: 'डेटा एवं गोपनीयता', icon: 'shield' },
  { to: '/admin/users', label: 'व्यवस्थापक खाते', icon: 'user', ownerOnly: true },
];

/** Authenticated shell: sidebar on desktop, compact top bar with scrolling nav on phones. */
export function AdminLayout() {
  const session = useAdminSession();
  const location = useLocation();

  if (!session.token) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (session.error && !session.profile) {
    return (
      <div className="container narrow section stack-md">
        <ErrorNotice error={session.error} />
        <div className="row-wrap">
          <Button onClick={session.retry}>फिर से प्रयास करें</Button>
          <Button variant="ghost" onClick={session.signOut}>
            लॉग आउट
          </Button>
        </div>
      </div>
    );
  }
  if (session.isLoading || !session.profile) return <Loading label="सत्र लोड हो रहा है…" />;

  return (
    <div className="admin">
      <aside className="admin__side">
        <Wordmark to="/admin" sub="ADMIN" inverse />
        <nav className="admin__nav" aria-label="व्यवस्थापक">
          {NAV.filter((item) => !item.ownerOnly || session.can('owner')).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `admin__link${isActive ? ' is-active' : ''}`}>
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__foot">
          <span>{session.profile.name}</span>
          <span className="admin__role">{ROLE_LABEL[session.profile.role]}</span>
          <NavLink to="/admin/account" className="admin__account">
            <Icon name="key" /> मेरा खाता
          </NavLink>
          <button type="button" className="admin__logout" onClick={session.signOut}>
            <Icon name="logout" /> लॉग आउट
          </button>
        </div>
      </aside>
      <main className="admin__main stack-md" id="main">
        <SystemStatus />
        <Outlet />
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div className="stack-xs">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="page-head__title">{title}</h1>
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}
