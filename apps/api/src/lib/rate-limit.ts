import rateLimit from 'express-rate-limit';

const base = { standardHeaders: 'draft-7', legacyHeaders: false } as const;

/** Default ceiling for all API traffic, per IP. */
export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 600 });

/** Login, OTP and submissions — abuse-prone endpoints, per IP. */
export const sensitiveLimiter = rateLimit({ ...base, windowMs: 10 * 60 * 1000, limit: 20 });
