import { Router } from 'express';
import { resolveRequestSchema } from '@sajag/shared';
import { asyncHandler, parse, routeParam } from '../../lib/http';
import { currentAdmin, requireAdmin } from '../auth/auth.middleware';
import { privacyService } from './privacy.service';

/** Mounted at /api/admin/privacy — owners manage compliance; analysts may read. */
export const privacyRouter = Router();

privacyRouter.get(
  '/summary',
  requireAdmin('owner', 'analyst'),
  asyncHandler(async (_req, res) => {
    res.json(await privacyService.summary());
  }),
);

privacyRouter.get(
  '/requests',
  requireAdmin('owner'),
  asyncHandler(async (_req, res) => {
    res.json(await privacyService.listRequests());
  }),
);

privacyRouter.patch(
  '/requests/:id',
  requireAdmin('owner'),
  asyncHandler(async (req, res) => {
    const input = parse(resolveRequestSchema, req.body);
    res.json(await privacyService.resolveRequest(routeParam(req, 'id'), input, currentAdmin(req).id));
  }),
);

privacyRouter.get(
  '/consents',
  requireAdmin('owner'),
  asyncHandler(async (_req, res) => {
    res.json(await privacyService.listConsents());
  }),
);

privacyRouter.get(
  '/audit',
  requireAdmin('owner'),
  asyncHandler(async (_req, res) => {
    res.json(await privacyService.listAudit());
  }),
);
