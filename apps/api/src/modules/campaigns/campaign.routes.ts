import { Router } from 'express';
import { campaignInputSchema, campaignStatusUpdateSchema, exportRequestSchema } from '@sajag/shared';
import { asyncHandler, parse, routeParam } from '../../lib/http';
import { analyticsService } from '../analytics/analytics.service';
import { currentAdmin, requireAdmin } from '../auth/auth.middleware';
import { campaignService } from './campaign.service';

/** Mounted at /api/admin/campaigns */
export const adminCampaignRouter = Router();

adminCampaignRouter.get(
  '/',
  requireAdmin(),
  asyncHandler(async (_req, res) => {
    res.json(await campaignService.listForAdmin());
  }),
);

adminCampaignRouter.post(
  '/',
  requireAdmin('owner', 'author'),
  asyncHandler(async (req, res) => {
    const created = await campaignService.create(parse(campaignInputSchema, req.body), currentAdmin(req).id);
    res.status(201).json(created);
  }),
);

adminCampaignRouter.get(
  '/:id',
  requireAdmin(),
  asyncHandler(async (req, res) => {
    res.json(await campaignService.getForAdmin(routeParam(req, 'id')));
  }),
);

adminCampaignRouter.put(
  '/:id',
  requireAdmin('owner', 'author'),
  asyncHandler(async (req, res) => {
    const input = parse(campaignInputSchema, req.body);
    res.json(await campaignService.update(routeParam(req, 'id'), input, currentAdmin(req).id));
  }),
);

adminCampaignRouter.patch(
  '/:id/status',
  requireAdmin('owner'),
  asyncHandler(async (req, res) => {
    const { status } = parse(campaignStatusUpdateSchema, req.body);
    res.json(await campaignService.setStatus(routeParam(req, 'id'), status, currentAdmin(req).id));
  }),
);

adminCampaignRouter.get(
  '/:id/analytics',
  requireAdmin('owner', 'analyst'),
  asyncHandler(async (req, res) => {
    const campaign = await campaignService.requireCampaign(routeParam(req, 'id'));
    res.json(await analyticsService.forCampaign(campaign, currentAdmin(req).role));
  }),
);

adminCampaignRouter.post(
  '/:id/export',
  requireAdmin('owner'),
  asyncHandler(async (req, res) => {
    const { reason } = parse(exportRequestSchema, req.body);
    const campaign = await campaignService.requireCampaign(routeParam(req, 'id'));
    const csv = await analyticsService.exportCsv(campaign, reason, currentAdmin(req).id);
    res
      .type('text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="campaign-${campaign.slug}.csv"`)
      .send(csv);
  }),
);
