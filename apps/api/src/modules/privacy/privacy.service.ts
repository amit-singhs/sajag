import type { AdminConsentView, AuditEntry, DataRequestView, PrivacySummary, ResolveRequestInput } from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { toIso } from '../../lib/dates';
import { Errors } from '../../lib/errors';
import { recordAudit } from '../audit/audit.service';
import { asConsentMethod, toDataRequestView } from './privacy.mappers';

const OPEN_STATUSES = ['open', 'in_progress'];
const LIST_LIMIT = 200;

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

  async listRequests(): Promise<DataRequestView[]> {
    const rows = await prisma.dataRequest.findMany({ orderBy: [{ status: 'asc' }, { dueAt: 'asc' }], take: LIST_LIMIT });
    return rows.map((r) => toDataRequestView(r));
  },

  async resolveRequest(id: string, input: ResolveRequestInput, actorId: string): Promise<DataRequestView> {
    const existing = await prisma.dataRequest.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound('Request');
    const done = input.status === 'resolved' || input.status === 'rejected';
    const updated = await prisma.dataRequest.update({
      where: { id },
      data: { status: input.status, response: input.response || null, resolvedAt: done ? new Date() : null, resolvedById: actorId },
    });
    await recordAudit({ actorId, action: `request.${input.status}`, entity: 'data_request', entityId: id, meta: { type: existing.type } });
    return toDataRequestView(updated);
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
