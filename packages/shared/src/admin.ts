import { z } from 'zod';
import type { AdminRole, ConsentMethod } from './constants';

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  admin: AdminProfile;
}

export interface CampaignAnalytics {
  campaignId: string;
  totals: {
    responses: number;
    last7Days: number;
    averageScore: number;
    maxScore: number;
    averagePercent: number;
    highScorerCount: number;
    highScorerShare: number;
    districts: number;
    tehsils: number;
    minors: number;
  };
  daily: Array<{ date: string; count: number }>;
  scoreDistribution: Array<{ score: number; count: number }>;
  questions: Array<{ questionId: string; index: number; topic: string; text: string; answered: number; correctRate: number }>;
  districts: Array<{ district: string; tehsils: number; responses: number; averageScore: number }>;
  recent: Array<{ submittedAt: string; name: string | null; mobileMasked: string; district: string | null; score: number; isMinor: boolean }>;
}

export interface AdminConsentView {
  id: string;
  campaignId: string;
  mobileMasked: string;
  method: ConsentMethod;
  noticeVersion: string;
  language: string;
  grantedAt: string;
  withdrawnAt: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  meta: string | null;
}

export interface PrivacySummary {
  openRequests: number;
  overdueRequests: number;
  minorsVerified: number;
  activeConsents: number;
  withdrawnConsents: number;
  scheduledErasures: number;
}

export const exportRequestSchema = z.object({
  reason: z.string().trim().min(5, 'State why the data is being exported').max(300),
});
