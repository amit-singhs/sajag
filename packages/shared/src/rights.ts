import { z } from 'zod';
import { DATA_REQUEST_STATUSES, DATA_REQUEST_TYPES, type DataRequestStatus, type DataRequestType } from './constants';
import { mobileSchema } from './mobile';

/** Types where the person must describe what they want (the others are self-explanatory). */
export const DETAIL_REQUIRED_REQUEST_TYPES: readonly DataRequestType[] = ['correction', 'grievance', 'nomination'];

/**
 * A data-principal request (DPDP Act ss. 11–14) filed by mobile number. There is no OTP/SMS verification yet,
 * so the administrator verifies the person by calling back on this number before acting.
 */
export const dataRequestInputSchema = z
  .object({
    mobile: mobileSchema,
    type: z.enum(DATA_REQUEST_TYPES),
    details: z.string().trim().max(2000),
  })
  .refine((r) => !DETAIL_REQUIRED_REQUEST_TYPES.includes(r.type) || r.details.length >= 5, {
    message: 'Please describe your request',
    path: ['details'],
  });
export type DataRequestInput = z.infer<typeof dataRequestInputSchema>;

export interface DataRequestReceipt {
  reference: string;
  dueAt: string;
}

export const resolveRequestSchema = z.object({
  status: z.enum(DATA_REQUEST_STATUSES).exclude(['open']),
  response: z.string().trim().max(2000),
});
export type ResolveRequestInput = z.infer<typeof resolveRequestSchema>;

export interface DataRequestView {
  id: string;
  /** Short reference shown to the person when they file the request. */
  reference: string;
  type: DataRequestType;
  status: DataRequestStatus;
  mobileMasked: string;
  /** Full number, only for owners — needed to call the person back and verify them. */
  mobile: string | null;
  details: string | null;
  response: string | null;
  createdAt: string;
  dueAt: string;
  resolvedAt: string | null;
  overdue: boolean;
  /** Participant records linked to this mobile number (0 = nothing stored). */
  linkedRecords: number;
}
