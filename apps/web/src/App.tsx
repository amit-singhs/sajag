import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { Loading } from './components/ui/Feedback';
import { LandingPage } from './features/landing/LandingPage';
import { PrivacyPolicyPage } from './features/privacy-notice/PrivacyPolicyPage';
import { QuizPage } from './features/quiz/QuizPage';
import { MyDataPage } from './features/rights/MyDataPage';

// Admin screens are split into their own chunks — participants on slow networks never download them.
const LoginPage = lazy(() => import('./features/admin/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./features/admin/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CampaignsPage = lazy(() => import('./features/admin/campaigns/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const BuilderPage = lazy(() => import('./features/admin/builder/BuilderPage').then((m) => ({ default: m.BuilderPage })));
const AdminUsersPage = lazy(() => import('./features/admin/users/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AccountPage = lazy(() => import('./features/admin/users/AccountPage').then((m) => ({ default: m.AccountPage })));
const PrivacyPage = lazy(() => import('./features/admin/privacy/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="c/:slug" element={<QuizPage />} />
          <Route path="my-data" element={<MyDataPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
        </Route>
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/new" element={<BuilderPage />} />
          <Route path="campaigns/:id" element={<BuilderPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
