import type { AdminConsentView, AuditEntry, DataRequestView, PrivacySummary, ResolveRequestInput } from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { toIso } from '../../lib/dates';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';
import { eraseParticipants } from './erasure.service';
import { asConsentMethod, toDataRequestView } from './privacy.mappers';

const OPEN_STATUSES = ['open', 'in_progress'];
const LIST_LIMIT = 200;
const ERASING_TYPES: readonly string[] = ['erasure', 'withdrawal'];

export const privacyService = {
  async summary(): Promise<PrivacySummary> {
    const now = new Date();
    const [openRequests, overdueRequests, minorsVerified, activeConsents, withdrawnConsents, scheduledErasures] = await Promise.all([
      prisma.dataRequest.count({ where: { status: { in: OPEN_STATUSES } } }),
      prisma.dataRequest.count({ where: { status: { in: OPEN_STATUSES }, dueAt: { lt: now } } }),
      prisma.participant.count({ where: { ageBand: 'minor', erasedAt: null } }),
      prisma.consent.count({ where: { withdrawnAt: null } }),
      prisma.consent.count({ where: { withdrawnAt: { not: null } } }),
      prisma.participant.count({ where: { erasedAt: null, scheduledErasureAt: { not: null } } }),
    ]);
    return { openRequests, overdueRequests, minorsVerified, activeConsents, withdrawnConsents, scheduledErasures };
  },

  /** Owner view: full mobile (to call back and verify) and how many stored records match it. */
  async listRequests(): Promise<DataRequestView[]> {
    const rows = await prisma.dataRequest.findMany({ orderBy: [{ status: 'asc' }, { dueAt: 'asc' }], take: LIST_LIMIT });
    const hashes = [...new Set(rows.map((r) => r.mobileHash))];
    const linked = hashes.length
      ? await prisma.participant.groupBy({ by: ['mobileHash'], where: { mobileHash: { in: hashes }, erasedAt: null }, _count: { _all: true } })
      : [];
    const counts = new Map(linked.map((l) => [l.mobileHash, l._count._all]));
    return rows.map((r) => toDataRequestView(r, { revealMobile: true, linkedRecords: counts.get(r.mobileHash) ?? 0 }));
  },

  /**
   * Resolving an erasure or withdrawal request erases everything linked to that mobile number.
   * The requester's number is cleared once the request is closed (data minimisation).
   */
  async resolveRequest(id: string, input: ResolveRequestInput, actorId: string): Promise<DataRequestView> {
    const existing = await prisma.dataRequest.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound('Request');
    const done = input.status === 'resolved' || input.status === 'rejected';
    const erases = input.status === 'resolved' && ERASING_TYPES.includes(existing.type);
    const erased = erases ? await eraseParticipants({ mobileHash: existing.mobileHash }, existing.type === 'withdrawal' ? 'consent_withdrawn' : 'erasure_request') : 0;

    const updated = await prisma.dataRequest.update({
      where: { id },
      data: {
        status: input.status,
        response: input.response || null,
        resolvedAt: done ? new Date() : null,
        resolvedById: actorId,
        ...(done ? { mobileEnc: null } : {}),
      },
    });
    await recordAudit({ actorId, action: `request.${input.status}`, entity: 'data_request', entityId: id, meta: { type: existing.type, erased } });
    const linkedRecords = await prisma.participant.count({ where: { mobileHash: existing.mobileHash, erasedAt: null } });
    return toDataRequestView(updated, { revealMobile: true, linkedRecords });
  },

  async listConsents(): Promise<AdminConsentView[]> {
    const rows = await prisma.consent.findMany({
      orderBy: { grantedAt: 'desc' },
      take: LIST_LIMIT,
      include: { participant: { select: { campaignId: true, mobileMasked: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      campaignId: c.participant.campaignId,
      mobileMasked: c.participant.mobileMasked,
      method: asConsentMethod(c.method),
      noticeVersion: c.noticeVersion,
      language: c.language,
      grantedAt: c.grantedAt.toISOString(),
      withdrawnAt: toIso(c.withdrawnAt),
    }));
  },

  async listAudit(): Promise<AuditEntry[]> {
    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      include: { actor: { select: { name: true } } },
    });
    return rows.map((a) => ({
      id: a.id,
      at: a.createdAt.toISOString(),
      actorName: a.actor?.name ?? null,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      meta: a.meta,
    }));
  },
};
