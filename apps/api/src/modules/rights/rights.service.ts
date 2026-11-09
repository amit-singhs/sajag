import {
  AGE_BANDS,
  DATA_REQUEST_SLA_DAYS,
  type DataRequestType,
  type ManualRequestInput,
  type MyDataView,
  type ParticipationView,
} from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { addDays, toIso } from '../../lib/dates';
import { recordAudit } from '../audit/audit.service';
import { campaignRepository } from '../campaigns/campaign.repository';
import { eraseParticipants } from '../privacy/erasure.service';
import { asConsentMethod, asMember, toDataRequestView } from '../privacy/privacy.mappers';

async function latestMask(mobileHash: string): Promise<string> {
  const p = await prisma.participant.findFirst({ where: { mobileHash }, orderBy: { createdAt: 'desc' }, select: { mobileMasked: true } });
  return p?.mobileMasked ?? '—';
}

async function logRequest(mobileHash: string, type: DataRequestType, details: string | null, resolved: boolean) {
  const now = new Date();
  return prisma.dataRequest.create({
    data: {
      mobileHash,
      mobileMasked: await latestMask(mobileHash),
      type,
      details,
      status: resolved ? 'resolved' : 'open',
      dueAt: addDays(now, DATA_REQUEST_SLA_DAYS),
      resolvedAt: resolved ? now : null,
    },
  });
}

/** Data-principal rights (DPDP Act ss. 11–14), for a person verified by OTP. */
export const rightsService = {
  async getMyData(mobileHash: string): Promise<MyDataView> {
    const [people, requests] = await Promise.all([
      prisma.participant.findMany({
        where: { mobileHash, erasedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { submission: true, consents: { orderBy: { grantedAt: 'desc' }, take: 1 } },
      }),
      prisma.dataRequest.findMany({ where: { mobileHash }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    const campaigns = await campaignRepository.findManyByIds([...new Set(people.map((p) => p.campaignId))]);
    const titles = new Map(campaigns.map((c) => [c._id.toHexString(), c.title]));

    const participations: ParticipationView[] = people.map((p) => {
      const consent = p.consents[0];
      return {
        participantId: p.id,
        campaignId: p.campaignId,
        campaignTitle: titles.get(p.campaignId) ?? '—',
        name: p.name,
        tehsil: p.tehsil,
        district: p.district,
        ageBand: asMember(AGE_BANDS, p.ageBand, 'adult'),
        score: p.submission?.score ?? null,
        maxScore: p.submission?.maxScore ?? null,
        submittedAt: toIso(p.submission?.submittedAt),
        scheduledErasureAt: toIso(p.scheduledErasureAt),
        consent: consent
          ? {
              id: consent.id,
              method: asConsentMethod(consent.method),
              noticeVersion: consent.noticeVersion,
              language: consent.language,
              grantedAt: consent.grantedAt.toISOString(),
              withdrawnAt: toIso(consent.withdrawnAt),
            }
          : null,
      };
    });

    await recordAudit({ actorId: null, action: 'rights.access', entity: 'data_principal', meta: { records: people.length } });
    return { mobileMasked: await latestMask(mobileHash), participations, requests: requests.map((r) => toDataRequestView(r)) };
  },

  async fileRequest(mobileHash: string, input: ManualRequestInput) {
    const request = await logRequest(mobileHash, input.type, input.details, false);
    await recordAudit({ actorId: null, action: 'rights.request', entity: 'data_request', entityId: request.id, meta: { type: input.type } });
    return toDataRequestView(request);
  },

  /** Withdraw consent for everything linked to this mobile and erase it immediately. */
  async withdrawAndErase(mobileHash: string): Promise<{ erased: number }> {
    await logRequest(mobileHash, 'withdrawal', null, true);
    const erased = await eraseParticipants({ mobileHash }, 'consent_withdrawn');
    return { erased };
  },
};
