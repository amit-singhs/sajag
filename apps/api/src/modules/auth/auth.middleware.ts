import type { Request, RequestHandler } from 'express';
import type { AdminRole } from '@sajag/shared';
import { Errors } from '../../lib/errors';
import { bearerToken, tokens } from '../../lib/tokens';

/** Authenticates the admin bearer token; when roles are given, the admin must hold one of them. */
export function requireAdmin(...roles: AdminRole[]): RequestHandler {
  return (req, _res, next) => {
    const token = bearerToken(req.headers.authorization);
    if (!token) return next(Errors.unauthorized());
    try {
      const claims = tokens.verifyAdmin(token);
      if (roles.length > 0 && !roles.includes(claims.role)) return next(Errors.forbidden());
      req.admin = { id: claims.sub, role: claims.role };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function currentAdmin(req: Request): { id: string; role: AdminRole } {
  if (!req.admin) throw Errors.unauthorized();
  return req.admin;
}
