import { Router } from 'express';
import { loginInputSchema } from '@sajag/shared';
import { asyncHandler, parse } from '../../lib/http';
import { sensitiveLimiter } from '../../lib/rate-limit';
import { currentAdmin, requireAdmin } from './auth.middleware';
import { authService } from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/login',
  sensitiveLimiter,
  asyncHandler(async (req, res) => {
    res.json(await authService.login(parse(loginInputSchema, req.body)));
  }),
);

authRouter.get(
  '/me',
  requireAdmin(),
  asyncHandler(async (req, res) => {
    res.json(await authService.profile(currentAdmin(req).id));
  }),
);
