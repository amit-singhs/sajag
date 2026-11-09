import { z } from 'zod';
import { ADMIN_ROLES, type AdminRole, type ConsentMethod, type QuestionType } from './constants';

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const MIN_PASSWORD_LENGTH = 10;
const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`).max(200);

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

/* ---------- Admin accounts ---------- */

export const adminCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(ADMIN_ROLES),
  password: passwordSchema,
});
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;

export const adminUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ADMIN_ROLES).optional(),
    isActive: z.boolean().optional(),
    /** Owner-set new password (reset). */
    password: passwordSchema.optional(),
  })
  .refine((u) => Object.values(u).some((v) => v !== undefined), { message: 'Nothing to update' });
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
  })
  .refine((p) => p.currentPassword !== p.newPassword, { message: 'New password must be different', path: ['newPassword'] });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface AdminUserView extends AdminProfile {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/* ---------- Analytics ---------- */

export interface QuestionAnalytics {
  questionId: string;
  index: number;
  type: QuestionType;
  topic: string;
  text: string;
  /** People who answered this question. */
  answered: number;
  /** % fully correct; null for unscored (open-text) questions. */
  correctRate: number | null;
  /** How many chose each option (choice questions). */
  options: Array<{ id: string; text: string; correct: boolean; count: number }>;
  /** Latest open-text answers — owners only, never for minors. */
  textAnswers: string[];
}

export interface CampaignAnalytics {
  campaignId: string;
  /** False for survey-style campaigns with no marks — the UI hides score charts. */
  scored: boolean;
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
  questions: QuestionAnalytics[];
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
