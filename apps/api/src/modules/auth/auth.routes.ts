import { Router } from 'express';
import { changePasswordSchema, loginInputSchema } from '@sajag/shared';
import { asyncHandler, parse } from '../../lib/http';
import { sensitiveLimiter } from '../../lib/rate-limit';
import { currentAdmin, requireAdmin } from './auth.middleware';
import { adminUsersService } from './admin-users.service';
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

authRouter.post(
  '/password',
  sensitiveLimiter,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    await adminUsersService.changeOwnPassword(currentAdmin(req).id, parse(changePasswordSchema, req.body));
    res.status(204).end();
  }),
);
