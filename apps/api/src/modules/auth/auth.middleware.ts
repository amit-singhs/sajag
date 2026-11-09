import type { Request, RequestHandler } from 'express';
import { ADMIN_ROLES, type AdminRole } from '@sajag/shared';
import { prisma } from '../../db/prisma';
import { Errors } from '../../lib/errors';
import { bearerToken, tokens } from '../../lib/tokens';

/**
 * Authenticates the admin bearer token and re-reads the account, so deactivating an admin or changing their
 * role takes effect immediately (not only when their token expires). With roles given, one must match.
 */
export function requireAdmin(...roles: AdminRole[]): RequestHandler {
  return (req, _res, next) => {
    const token = bearerToken(req.headers.authorization);
    if (!token) return next(Errors.unauthorized());
    let claims: { sub: string };
    try {
      claims = tokens.verifyAdmin(token);
    } catch (error) {
      return next(error);
    }
    prisma.adminUser
      .findUnique({ where: { id: claims.sub }, select: { id: true, role: true, isActive: true } })
      .then((user) => {
        if (!user || !user.isActive) return next(Errors.unauthorized('Your account is not active'));
        const role = (ADMIN_ROLES as readonly string[]).includes(user.role) ? (user.role as AdminRole) : 'analyst';
        if (roles.length > 0 && !roles.includes(role)) return next(Errors.forbidden());
        req.admin = { id: user.id, role };
        next();
      })
      .catch(next);
  };
}

export function currentAdmin(req: Request): { id: string; role: AdminRole } {
  if (!req.admin) throw Errors.unauthorized();
  return req.admin;
}
