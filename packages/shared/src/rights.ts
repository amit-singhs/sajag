import { z } from 'zod';
import {
  DATA_REQUEST_STATUSES,
  MANUAL_REQUEST_TYPES,
  type AgeBand,
  type ConsentMethod,
  type DataRequestStatus,
  type DataRequestType,
} from './constants';

export const manualRequestSchema = z.object({
  type: z.enum(MANUAL_REQUEST_TYPES),
  details: z.string().trim().min(5).max(2000),
});
export type ManualRequestInput = z.infer<typeof manualRequestSchema>;

export const resolveRequestSchema = z.object({
  status: z.enum(DATA_REQUEST_STATUSES).exclude(['open']),
  response: z.string().trim().max(2000),
});
export type ResolveRequestInput = z.infer<typeof resolveRequestSchema>;

export interface ConsentView {
  id: string;
  method: ConsentMethod;
  noticeVersion: string;
  language: string;
  grantedAt: string;
  withdrawnAt: string | null;
}

export interface ParticipationView {
  participantId: string;
  campaignId: string;
  campaignTitle: string;
  name: string | null;
  tehsil: string | null;
  district: string | null;
  ageBand: AgeBand;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
  scheduledErasureAt: string | null;
  consent: ConsentView | null;
}

export interface DataRequestView {
  id: string;
  type: DataRequestType;
  status: DataRequestStatus;
  mobileMasked: string;
  details: string | null;
  response: string | null;
  createdAt: string;
  dueAt: string;
  resolvedAt: string | null;
  overdue: boolean;
}

export interface MyDataView {
  mobileMasked: string;
  participations: ParticipationView[];
  requests: DataRequestView[];
}
