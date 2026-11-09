import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType, ZodTypeDef } from 'zod';
import { Errors } from './errors';

/** Wraps an async route handler so rejected promises reach the error middleware (Express 4). */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Parses untrusted input with a shared zod schema; throws a 400 with field issues on failure. */
export function parse<T>(schema: ZodType<T, ZodTypeDef, unknown>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw Errors.badRequest('Validation failed', result.error.flatten());
  }
  return result.data;
}

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) throw Errors.badRequest(`Missing route parameter: ${name}`);
  return value;
}
