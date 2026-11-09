import { Router } from 'express';
import { adminCreateSchema, adminUpdateSchema } from '@sajag/shared';
import { asyncHandler, parse, routeParam } from '../../lib/http';
import { currentAdmin, requireAdmin } from './auth.middleware';
import { adminUsersService } from './admin-users.service';

/** Mounted at /api/admin/users — owners manage admin accounts. */
export const adminUsersRouter = Router();
adminUsersRouter.use(requireAdmin('owner'));

adminUsersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await adminUsersService.list());
  }),
);

adminUsersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    res.status(201).json(await adminUsersService.create(parse(adminCreateSchema, req.body), currentAdmin(req).id));
  }),
);

adminUsersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await adminUsersService.update(routeParam(req, 'id'), parse(adminUpdateSchema, req.body), currentAdmin(req).id));
  }),
);
