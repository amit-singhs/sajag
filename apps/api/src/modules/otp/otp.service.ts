import { randomUUID } from 'node:crypto';
import type { OtpPurpose, OtpRequestInput, OtpRequestResult, OtpVerifyInput, OtpVerifyResult } from '@sajag/shared';
import { isProduction } from '../../config/env';
import { prisma } from '../../db/prisma';
import { keyedHash, numericCode, safeEqual } from '../../lib/crypto';
import { Errors } from '../../lib/errors';
import { OTP_TOKEN_TTL_SECONDS, expiryIso, tokens } from '../../lib/tokens';
import { smsProvider } from './sms';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const codeHash = (challengeId: string, code: string) => keyedHash(`${challengeId}:${code}`);

export const otpService = {
  async request(input: OtpRequestInput): Promise<OtpRequestResult> {
    const mobileHash = keyedHash(input.mobile);
    const now = Date.now();
    const recent = await prisma.otpChallenge.findMany({
      where: { mobileHash, purpose: input.purpose, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (recent.length >= MAX_PER_HOUR) throw Errors.tooMany('Too many codes requested. Try again in an hour.');
    if (recent[0] && now - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw Errors.tooMany('Please wait 30 seconds before requesting another code.');
    }

    const id = randomUUID();
    const code = numericCode();
    const expiresAt = new Date(now + CODE_TTL_MS);
    await prisma.otpChallenge.create({
      data: { id, mobileHash, purpose: input.purpose, codeHash: codeHash(id, code), expiresAt },
    });
    await smsProvider.sendOtp(input.mobile, code);

    const exposeCode = smsProvider.isSimulated && !isProduction;
    return { challengeId: id, expiresAt: expiresAt.toISOString(), ...(exposeCode ? { devCode: code } : {}) };
  },

  async verify(input: OtpVerifyInput): Promise<OtpVerifyResult> {
    const challenge = await prisma.otpChallenge.findUnique({ where: { id: input.challengeId } });
    if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
      throw Errors.badRequest('This code has expired. Request a new one.');
    }
    if (challenge.attempts >= MAX_ATTEMPTS) throw Errors.tooMany('Too many wrong attempts. Request a new code.');

    if (!safeEqual(challenge.codeHash, codeHash(challenge.id, input.code))) {
      await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
      throw Errors.badRequest('Incorrect code');
    }
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });

    const purpose = challenge.purpose as OtpPurpose;
    return {
      token: tokens.signOtp({ sub: challenge.mobileHash, purpose }),
      expiresAt: expiryIso(OTP_TOKEN_TTL_SECONDS),
    };
  },

  /** Confirms a verification token was issued for this purpose and (optionally) this exact mobile. */
  assertVerified(token: string, purpose: OtpPurpose, mobile?: string): { mobileHash: string } {
    const claims = tokens.verifyOtp(token, purpose);
    if (mobile && claims.sub !== keyedHash(mobile)) throw Errors.unauthorized('Verification does not match this mobile number');
    return { mobileHash: claims.sub };
  },
};
