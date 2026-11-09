/** Error envelope returned by every non-2xx API response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface HealthStatus {
  sql: 'up' | 'down';
  documentDb: 'up' | 'down';
}

export interface PublicConfig {
  organization: string;
  grievanceOfficer: { name: string; email: string; phone: string };
  smsEnabled: boolean;
  digilockerEnabled: boolean;
}

/** Route paths, shared so the client never hard-codes a URL twice. */
export const API = {
  health: '/health',
  config: '/public/config',
  campaigns: '/public/campaigns',
  campaign: (slug: string) => `/public/campaigns/${encodeURIComponent(slug)}`,
  submit: (slug: string) => `/public/campaigns/${encodeURIComponent(slug)}/submissions`,
  otpRequest: '/otp/request',
  otpVerify: '/otp/verify',
  me: '/me',
  meRequests: '/me/requests',
  meWithdraw: '/me/withdraw',
  adminLogin: '/admin/auth/login',
  adminMe: '/admin/auth/me',
  adminCampaigns: '/admin/campaigns',
  adminCampaign: (id: string) => `/admin/campaigns/${encodeURIComponent(id)}`,
  adminCampaignStatus: (id: string) => `/admin/campaigns/${encodeURIComponent(id)}/status`,
  adminCampaignAnalytics: (id: string) => `/admin/campaigns/${encodeURIComponent(id)}/analytics`,
  adminCampaignExport: (id: string) => `/admin/campaigns/${encodeURIComponent(id)}/export`,
  adminPrivacySummary: '/admin/privacy/summary',
  adminPrivacyRequests: '/admin/privacy/requests',
  adminPrivacyRequest: (id: string) => `/admin/privacy/requests/${encodeURIComponent(id)}`,
  adminPrivacyConsents: '/admin/privacy/consents',
  adminPrivacyAudit: '/admin/privacy/audit',
} as const;
