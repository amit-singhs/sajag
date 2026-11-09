import type { AdminRole, CampaignAnalytics } from '@sajag/shared';
import type { CampaignDocument } from '../../db/mongo';
import { prisma } from '../../db/prisma';
import { DAY_MS, istDateKey } from '../../lib/dates';
import { recordAudit } from '../audit/audit.service';

const HIGH_SCORE_RATIO = 0.8;
const DAILY_WINDOW = 30;
const RECENT_LIMIT = 10;

const round1 = (n: number) => Math.round(n * 10) / 10;

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Neutralise spreadsheet formula injection and quote every cell.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

async function loadSubmissions(campaignId: string) {
  return prisma.submission.findMany({
    where: { campaignId },
    orderBy: { submittedAt: 'desc' },
    select: {
      score: true,
      submittedAt: true,
      participant: { select: { name: true, mobileMasked: true, tehsil: true, district: true, ageBand: true, erasedAt: true } },
    },
  });
}

export const analyticsService = {
  async forCampaign(campaign: CampaignDocument, viewerRole: AdminRole): Promise<CampaignAnalytics> {
    const campaignId = campaign._id.toHexString();
    const maxScore = campaign.questions.reduce((s, q) => s + (q.type === 'text' ? 0 : q.points), 0);
    const [submissions, answerGroups] = await Promise.all([
      loadSubmissions(campaignId),
      prisma.answerResult.groupBy({ by: ['questionId', 'isCorrect'], where: { campaignId }, _count: { _all: true } }),
    ]);

    const now = Date.now();
    const responses = submissions.length;
    const totalScore = submissions.reduce((s, x) => s + x.score, 0);
    const highScorerCount = submissions.filter((x) => maxScore > 0 && x.score / maxScore >= HIGH_SCORE_RATIO).length;

    // Daily counts for the last 30 days (IST), zero-filled.
    const dailyMap = new Map<string, number>();
    for (let i = DAILY_WINDOW - 1; i >= 0; i--) dailyMap.set(istDateKey(new Date(now - i * DAY_MS)), 0);
    for (const s of submissions) {
      const key = istDateKey(s.submittedAt);
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }

    const distribution = new Map<number, number>();
    for (let score = 0; score <= Math.ceil(maxScore); score++) distribution.set(score, 0);
    for (const s of submissions) {
      const bucket = Math.round(s.score);
      distribution.set(bucket, (distribution.get(bucket) ?? 0) + 1);
    }

    const perQuestion = new Map<string, { answered: number; correct: number }>();
    for (const g of answerGroups) {
      const entry = perQuestion.get(g.questionId) ?? { answered: 0, correct: 0 };
      entry.answered += g._count._all;
      if (g.isCorrect) entry.correct += g._count._all;
      perQuestion.set(g.questionId, entry);
    }

    const byDistrict = new Map<string, { tehsils: Set<string>; responses: number; total: number }>();
    const allTehsils = new Set<string>();
    for (const s of submissions) {
      const district = s.participant.district ?? '—';
      const entry = byDistrict.get(district) ?? { tehsils: new Set<string>(), responses: 0, total: 0 };
      entry.responses += 1;
      entry.total += s.score;
      if (s.participant.tehsil) {
        entry.tehsils.add(s.participant.tehsil);
        allTehsils.add(`${district}/${s.participant.tehsil}`);
      }
      byDistrict.set(district, entry);
    }

    const canSeeNames = viewerRole === 'owner';
    return {
      campaignId,
      totals: {
        responses,
        last7Days: submissions.filter((s) => now - s.submittedAt.getTime() < 7 * DAY_MS).length,
        averageScore: responses ? round1(totalScore / responses) : 0,
        maxScore,
        averagePercent: responses && maxScore ? Math.round((totalScore / responses / maxScore) * 100) : 0,
        highScorerCount,
        highScorerShare: responses ? Math.round((highScorerCount / responses) * 100) : 0,
        districts: [...byDistrict.keys()].filter((d) => d !== '—').length,
        tehsils: allTehsils.size,
        minors: submissions.filter((s) => s.participant.ageBand === 'minor').length,
      },
      daily: [...dailyMap].map(([date, count]) => ({ date, count })),
      scoreDistribution: [...distribution].map(([score, count]) => ({ score, count })),
      questions: campaign.questions
        .filter((q) => q.type !== 'text')
        .map((q, index) => {
          const stats = perQuestion.get(q.id) ?? { answered: 0, correct: 0 };
          return {
            questionId: q.id,
            index: index + 1,
            topic: q.topic,
            text: q.text,
            answered: stats.answered,
            correctRate: stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0,
          };
        }),
      districts: [...byDistrict]
        .map(([district, e]) => ({ district, tehsils: e.tehsils.size, responses: e.responses, averageScore: round1(e.total / e.responses) }))
        .sort((a, b) => b.responses - a.responses),
      recent: submissions.slice(0, RECENT_LIMIT).map((s) => {
        const isMinor = s.participant.ageBand === 'minor';
        return {
          submittedAt: s.submittedAt.toISOString(),
          name: canSeeNames && !isMinor && !s.participant.erasedAt ? s.participant.name : null,
          mobileMasked: s.participant.mobileMasked,
          district: s.participant.district,
          score: s.score,
          isMinor,
        };
      }),
    };
  },

  /** Adults only, masked mobiles, reason logged — data minimisation for exports. */
  async exportCsv(campaign: CampaignDocument, reason: string, actorId: string): Promise<string> {
    const campaignId = campaign._id.toHexString();
    const rows = await prisma.submission.findMany({
      where: { campaignId, participant: { ageBand: 'adult', erasedAt: null } },
      orderBy: { submittedAt: 'asc' },
      select: {
        score: true,
        maxScore: true,
        submittedAt: true,
        answers: { select: { questionId: true, isCorrect: true } },
        participant: { select: { name: true, mobileMasked: true, tehsil: true, district: true } },
      },
    });
    const scored = campaign.questions.filter((q) => q.type !== 'text');
    const header = ['submitted_at', 'name', 'mobile', 'tehsil', 'district', 'score', 'max_score', ...scored.map((q) => q.id)];
    const lines = rows.map((r) => {
      const correctness = new Map(r.answers.map((a) => [a.questionId, a.isCorrect]));
      return [
        r.submittedAt.toISOString(),
        r.participant.name,
        r.participant.mobileMasked,
        r.participant.tehsil,
        r.participant.district,
        r.score,
        r.maxScore,
        ...scored.map((q) => (correctness.get(q.id) ? 1 : 0)),
      ]
        .map(csvCell)
        .join(',');
    });
    await recordAudit({ actorId, action: 'campaign.export', entity: 'campaign', entityId: campaignId, meta: { reason, rows: rows.length } });
    return `﻿${[header.map(csvCell).join(','), ...lines].join('\n')}`;
  },
};
