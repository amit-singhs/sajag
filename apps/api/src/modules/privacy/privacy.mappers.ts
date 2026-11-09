import type { DataRequest } from '@prisma/client';
import {
  CONSENT_METHODS,
  DATA_REQUEST_STATUSES,
  DATA_REQUEST_TYPES,
  type ConsentMethod,
  type DataRequestStatus,
  type DataRequestType,
  type DataRequestView,
} from '@sajag/shared';
import { decrypt } from '../../lib/crypto';
import { toIso } from '../../lib/dates';

/** Narrows a stored string to a known union member (SQL Server has no enums). */
export function asMember<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

export const asConsentMethod = (v: string): ConsentMethod => asMember(CONSENT_METHODS, v, 'self');
const asRequestType = (v: string): DataRequestType => asMember(DATA_REQUEST_TYPES, v, 'grievance');
const asRequestStatus = (v: string): DataRequestStatus => asMember(DATA_REQUEST_STATUSES, v, 'open');

/** Short human reference for a request, e.g. "DR-3F9A2C". */
export const referenceOf = (id: string): string => `DR-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

interface ViewOptions {
  revealMobile: boolean;
  linkedRecords: number;
  now?: Date;
}

export function toDataRequestView(r: DataRequest, { revealMobile, linkedRecords, now = new Date() }: ViewOptions): DataRequestView {
  const status = asRequestStatus(r.status);
  const isOpen = status === 'open' || status === 'in_progress';
  return {
    id: r.id,
    reference: referenceOf(r.id),
    type: asRequestType(r.type),
    status,
    mobileMasked: r.mobileMasked,
    mobile: revealMobile && r.mobileEnc ? decrypt(r.mobileEnc) : null,
    details: r.details,
    response: r.response,
    createdAt: r.createdAt.toISOString(),
    dueAt: r.dueAt.toISOString(),
    resolvedAt: toIso(r.resolvedAt),
    overdue: isOpen && r.dueAt < now,
    linkedRecords,
  };
}
