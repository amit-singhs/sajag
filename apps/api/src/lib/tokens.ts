import jwt from 'jsonwebtoken';
import { ADMIN_ROLES, OTP_PURPOSES, type AdminRole, type OtpPurpose } from '@sajag/shared';
import { z } from 'zod';
import { env } from '../config/env';
import { Errors } from './errors';

const ISSUER = 'sajag-api';
export const ADMIN_TOKEN_TTL_SECONDS = 8 * 60 * 60;
export const OTP_TOKEN_TTL_SECONDS = 20 * 60;

const adminClaims = z.object({ sub: z.string(), role: z.enum(ADMIN_ROLES) });
const otpClaims = z.object({ sub: z.string(), purpose: z.enum(OTP_PURPOSES) });

export interface AdminTokenClaims {
  sub: string;
  role: AdminRole;
}
export interface OtpTokenClaims {
  /** keyed hash of the verified mobile number */
  sub: string;
  purpose: OtpPurpose;
}

type Audience = 'admin' | 'otp';

function sign(payload: object, audience: Audience, ttlSeconds: number): string {
  return jwt.sign(payload, env.JWT_SECRET, { audience, issuer: ISSUER, expiresIn: ttlSeconds, algorithm: 'HS256' });
}

function verify(token: string, audience: Audience): unknown {
  try {
    return jwt.verify(token, env.JWT_SECRET, { audience, issuer: ISSUER, algorithms: ['HS256'] });
  } catch {
    throw Errors.unauthorized('Session expired or invalid — please sign in again');
  }
}

export const tokens = {
  signAdmin: (claims: AdminTokenClaims) => sign(claims, 'admin', ADMIN_TOKEN_TTL_SECONDS),
  verifyAdmin: (token: string): AdminTokenClaims => adminClaims.parse(verify(token, 'admin')),
  signOtp: (claims: OtpTokenClaims) => sign(claims, 'otp', OTP_TOKEN_TTL_SECONDS),
  verifyOtp: (token: string, purpose: OtpPurpose): OtpTokenClaims => {
    const claims = otpClaims.parse(verify(token, 'otp'));
    if (claims.purpose !== purpose) throw Errors.unauthorized('Verification is not valid for this action');
    return claims;
  },
};

export function bearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

export const expiryIso = (ttlSeconds: number): string => new Date(Date.now() + ttlSeconds * 1000).toISOString();
