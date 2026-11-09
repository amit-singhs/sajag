import { env, isProduction } from '../../../config/env';
import { logger } from '../../../lib/logger';
import { ConsoleSmsProvider } from './console.provider';
import { Msg91SmsProvider } from './msg91.provider';
import type { SmsProvider } from './sms-provider';

function createSmsProvider(): SmsProvider {
  if (env.SMS_PROVIDER === 'msg91' && env.MSG91_AUTH_KEY && env.MSG91_TEMPLATE_ID) {
    return new Msg91SmsProvider({
      authKey: env.MSG91_AUTH_KEY,
      otpTemplateId: env.MSG91_TEMPLATE_ID,
    });
  }
  if (isProduction) logger.warn('SMS_PROVIDER=console in production: OTPs are only logged, participants cannot verify');
  return new ConsoleSmsProvider();
}

export const smsProvider: SmsProvider = createSmsProvider();
export type { SmsProvider };
