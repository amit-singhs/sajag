import { Router } from 'express';
import { dataRequestInputSchema, submissionInputSchema, type PublicConfig } from '@sajag/shared';
import { env } from '../../config/env';
import { asyncHandler, parse, routeParam } from '../../lib/http';
import { sensitiveLimiter } from '../../lib/rate-limit';
import { campaignService } from '../campaigns/campaign.service';
import { smsProvider } from '../otp/sms';
import { dataRequestService } from '../privacy/data-request.service';
import { submissionService } from './submission.service';

/** Mounted at /api/public — no authentication. */
export const publicRouter = Router();

publicRouter.get('/config', (_req, res) => {
  const config: PublicConfig = {
    organization: env.ORG_NAME,
    grievanceOfficer: {
      name: env.GRIEVANCE_OFFICER_NAME,
      email: env.GRIEVANCE_OFFICER_EMAIL,
      phone: env.GRIEVANCE_OFFICER_PHONE,
    },
    smsEnabled: !smsProvider.isSimulated,
    // DigiLocker needs a partner integration (OAuth + age attestation); enable once it is implemented.
    digilockerEnabled: false,
  };
  res.json(config);
});

publicRouter.get(
  '/campaigns',
  asyncHandler(async (_req, res) => {
    res.json(await campaignService.listLive());
  }),
);

publicRouter.get(
  '/campaigns/:slug',
  asyncHandler(async (req, res) => {
    res.json(await campaignService.getPublic(routeParam(req, 'slug')));
  }),
);

publicRouter.post(
  '/campaigns/:slug/submissions',
  sensitiveLimiter,
  asyncHandler(async (req, res) => {
    const input = parse(submissionInputSchema, req.body);
    res.status(201).json(await submissionService.submit(routeParam(req, 'slug'), input));
  }),
);

/** Data-principal requests (access, correction, erasure, withdrawal, grievance, nomination) by mobile number. */
publicRouter.post(
  '/data-requests',
  sensitiveLimiter,
  asyncHandler(async (req, res) => {
    res.status(201).json(await dataRequestService.file(parse(dataRequestInputSchema, req.body)));
  }),
);
