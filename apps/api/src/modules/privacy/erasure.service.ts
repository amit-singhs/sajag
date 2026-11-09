import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { recordAudit } from '../audit/audit.service';

export type ErasureReason = 'consent_withdrawn' | 'erasure_request' | 'retention_expired';

/**
 * Irreversibly removes personal data while keeping anonymous statistics (score, district, per-question correctness).
 * Single implementation used by self-service withdrawal, admin-handled requests and the retention job.
 */
export async function eraseParticipants(where: Prisma.ParticipantWhereInput, reason: ErasureReason): Promise<number> {
  const targets = await prisma.participant.findMany({ where: { ...where, erasedAt: null }, select: { id: true } });
  const now = new Date();

  for (const { id } of targets) {
    await prisma.$transaction([
      prisma.participant.update({
        where: { id },
        data: { name: null, tehsil: null, mobileEnc: null, mobileHash: `erased:${id}`, mobileMasked: '—', erasedAt: now },
      }),
      prisma.consent.updateMany({
        where: { participantId: id },
        data: { guardianName: null, guardianMobileEnc: null, guardianMobileHash: null },
      }),
      prisma.consent.updateMany({ where: { participantId: id, withdrawnAt: null }, data: { withdrawnAt: now } }),
      // Open-text answers may contain personal details; correctness rows stay for anonymous statistics.
      prisma.submission.updateMany({ where: { participantId: id }, data: { answersJson: '[]' } }),
    ]);
  }

  if (targets.length > 0) {
    await recordAudit({ actorId: null, action: 'participant.erase', entity: 'participant', meta: { count: targets.length, reason } });
  }
  return targets.length;
}
