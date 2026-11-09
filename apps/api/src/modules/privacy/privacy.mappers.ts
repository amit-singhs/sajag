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
import { toIso } from '../../lib/dates';

/** Narrows a stored string to a known union member (SQL Server has no enums). */
export function asMember<T extends string>(values: readonly T[], value: string, fallback: T): T {
  return (values as readonly string[]).includes(value) ? (value as T) : fallback;
}

export const asConsentMethod = (v: string): ConsentMethod => asMember(CONSENT_METHODS, v, 'self');
const asRequestType = (v: string): DataRequestType => asMember(DATA_REQUEST_TYPES, v, 'grievance');
const asRequestStatus = (v: string): DataRequestStatus => asMember(DATA_REQUEST_STATUSES, v, 'open');

export function toDataRequestView(r: DataRequest, now = new Date()): DataRequestView {
  const status = asRequestStatus(r.status);
  const isOpen = status === 'open' || status === 'in_progress';
  return {
    id: r.id,
    type: asRequestType(r.type),
    status,
    mobileMasked: r.mobileMasked,
    details: r.details,
    response: r.response,
    createdAt: r.createdAt.toISOString(),
    dueAt: r.dueAt.toISOString(),
    resolvedAt: toIso(r.resolvedAt),
    overdue: isOpen && r.dueAt < now,
  };
}
