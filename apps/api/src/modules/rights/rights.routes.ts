import { Router, type RequestHandler } from 'express';
import { manualRequestSchema } from '@sajag/shared';
import { Errors } from '../../lib/errors';
import { asyncHandler, parse } from '../../lib/http';
import { bearerToken } from '../../lib/tokens';
import { otpService } from '../otp/otp.service';
import { rightsService } from './rights.service';

/** Requires a bearer token from POST /otp/verify with purpose "data_rights". */
const requireDataSubject: RequestHandler = (req, _res, next) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) return next(Errors.unauthorized('Verify your mobile number first'));
  try {
    req.dataSubject = otpService.assertVerified(token, 'data_rights');
    next();
  } catch (error) {
    next(error);
  }
};

function subjectHash(req: Express.Request): string {
  if (!req.dataSubject) throw Errors.unauthorized();
  return req.dataSubject.mobileHash;
}

/** Mounted at /api/me */
export const rightsRouter = Router();
rightsRouter.use(requireDataSubject);

rightsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await rightsService.getMyData(subjectHash(req)));
  }),
);

rightsRouter.post(
  '/requests',
  asyncHandler(async (req, res) => {
    res.status(201).json(await rightsService.fileRequest(subjectHash(req), parse(manualRequestSchema, req.body)));
  }),
);

rightsRouter.post(
  '/withdraw',
  asyncHandler(async (req, res) => {
    res.json(await rightsService.withdrawAndErase(subjectHash(req)));
  }),
);
