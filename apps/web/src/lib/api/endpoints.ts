import {
  API,
  type AdminConsentView,
  type AdminCreateInput,
  type AdminProfile,
  type AdminUpdateInput,
  type AdminUserView,
  type AuditEntry,
  type Campaign,
  type CampaignAnalytics,
  type CampaignInput,
  type CampaignStatus,
  type CampaignSummary,
  type ChangePasswordInput,
  type DataRequestInput,
  type DataRequestReceipt,
  type DataRequestView,
  type HealthStatus,
  type LoginInput,
  type LoginResult,
  type PrivacySummary,
  type PublicCampaign,
  type PublicConfig,
  type ResolveRequestInput,
  type SubmissionInput,
  type SubmissionResult,
} from '@sajag/shared';
import { request, requestBlob } from './client';

export const publicApi = {
  health: () => request<HealthStatus>(API.health),
  config: () => request<PublicConfig>(API.config),
  campaigns: () => request<CampaignSummary[]>(API.campaigns),
  campaign: (slug: string) => request<PublicCampaign>(API.campaign(slug)),
  submit: (slug: string, body: SubmissionInput) => request<SubmissionResult>(API.submit(slug), { method: 'POST', body }),
  fileDataRequest: (body: DataRequestInput) => request<DataRequestReceipt>(API.dataRequests, { method: 'POST', body }),
};

export const adminApi = {
  login: (body: LoginInput) => request<LoginResult>(API.adminLogin, { method: 'POST', body }),
  me: () => request<AdminProfile>(API.adminMe),
  changePassword: (body: ChangePasswordInput) => request<void>(API.adminPassword, { method: 'POST', body }),
  users: () => request<AdminUserView[]>(API.adminUsers),
  createUser: (body: AdminCreateInput) => request<AdminUserView>(API.adminUsers, { method: 'POST', body }),
  updateUser: (id: string, body: AdminUpdateInput) => request<AdminUserView>(API.adminUser(id), { method: 'PATCH', body }),
  campaigns: () => request<CampaignSummary[]>(API.adminCampaigns),
  campaign: (id: string) => request<Campaign>(API.adminCampaign(id)),
  createCampaign: (body: CampaignInput) => request<Campaign>(API.adminCampaigns, { method: 'POST', body }),
  updateCampaign: (id: string, body: CampaignInput) => request<Campaign>(API.adminCampaign(id), { method: 'PUT', body }),
  setStatus: (id: string, status: CampaignStatus) =>
    request<Campaign>(API.adminCampaignStatus(id), { method: 'PATCH', body: { status } }),
  analytics: (id: string) => request<CampaignAnalytics>(API.adminCampaignAnalytics(id)),
  exportCsv: (id: string, reason: string) => requestBlob(API.adminCampaignExport(id), { method: 'POST', body: { reason } }),
  privacySummary: () => request<PrivacySummary>(API.adminPrivacySummary),
  requests: () => request<DataRequestView[]>(API.adminPrivacyRequests),
  resolveRequest: (id: string, body: ResolveRequestInput) =>
    request<DataRequestView>(API.adminPrivacyRequest(id), { method: 'PATCH', body }),
  consents: () => request<AdminConsentView[]>(API.adminPrivacyConsents),
  audit: () => request<AuditEntry[]>(API.adminPrivacyAudit),
};

/** React Query keys in one place, so invalidation never drifts from fetching. */
export const queryKeys = {
  config: ['config'] as const,
  health: ['health'] as const,
  liveCampaigns: ['campaigns', 'live'] as const,
  publicCampaign: (slug: string) => ['campaigns', 'public', slug] as const,
  adminMe: ['admin', 'me'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminCampaigns: ['admin', 'campaigns'] as const,
  adminCampaign: (id: string) => ['admin', 'campaigns', id] as const,
  analytics: (id: string) => ['admin', 'analytics', id] as const,
  privacySummary: ['admin', 'privacy', 'summary'] as const,
  privacyRequests: ['admin', 'privacy', 'requests'] as const,
  privacyConsents: ['admin', 'privacy', 'consents'] as const,
  privacyAudit: ['admin', 'privacy', 'audit'] as const,
};
