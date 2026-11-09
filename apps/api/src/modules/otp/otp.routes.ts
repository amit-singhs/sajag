import { Router } from 'express';
import { otpRequestSchema, otpVerifySchema } from '@sajag/shared';
import { asyncHandler, parse } from '../../lib/http';
import { sensitiveLimiter } from '../../lib/rate-limit';
import { otpService } from './otp.service';

/** Mounted at /api/otp */
export const otpRouter = Router();

otpRouter.post(
  '/request',
  sensitiveLimiter,
  asyncHandler(async (req, res) => {
    res.status(201).json(await otpService.request(parse(otpRequestSchema, req.body)));
  }),
);

otpRouter.post(
  '/verify',
  sensitiveLimiter,
  asyncHandler(async (req, res) => {
    res.json(await otpService.verify(parse(otpVerifySchema, req.body)));
  }),
);
