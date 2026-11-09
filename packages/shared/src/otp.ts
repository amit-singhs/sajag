import { z } from 'zod';
import { OTP_PURPOSES } from './constants';
import { mobileSchema } from './mobile';

export const otpRequestSchema = z.object({
  mobile: mobileSchema,
  purpose: z.enum(OTP_PURPOSES),
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export interface OtpRequestResult {
  challengeId: string;
  expiresAt: string;
  /** Only present when the API runs with SMS_PROVIDER=console (local development). */
  devCode?: string;
}

export interface OtpVerifyResult {
  token: string;
  expiresAt: string;
}
