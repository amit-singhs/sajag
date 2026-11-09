import { maskMobile } from '@sajag/shared';
import { logger } from '../../../lib/logger';
import type { SmsProvider } from './sms-provider';

/** Development provider: prints messages to the API log instead of sending SMS. */
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = 'console';
  readonly isSimulated = true;

  async sendOtp(mobile: string, code: string): Promise<void> {
    logger.info(`[sms:console] OTP for ${maskMobile(mobile)} is ${code}`);
  }

  async sendErasureNotice(mobile: string, erasureDate: Date): Promise<void> {
    logger.info(`[sms:console] Erasure notice to ${maskMobile(mobile)} for ${erasureDate.toISOString()}`);
  }
}
