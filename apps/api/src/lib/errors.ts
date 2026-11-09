export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  badRequest: (message: string, details?: unknown) => new AppError(400, 'bad_request', message, details),
  unauthorized: (message = 'Authentication required') => new AppError(401, 'unauthorized', message),
  forbidden: (message = 'You do not have access to this resource') => new AppError(403, 'forbidden', message),
  notFound: (what = 'Resource') => new AppError(404, 'not_found', `${what} not found`),
  conflict: (message: string) => new AppError(409, 'conflict', message),
  gone: (message: string) => new AppError(410, 'gone', message),
  tooMany: (message = 'Too many attempts, try again later') => new AppError(429, 'too_many_requests', message),
  notImplemented: (message: string) => new AppError(501, 'not_implemented', message),
} as const;
