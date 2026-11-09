import { logger } from '../../../lib/logger';
import type { SmsProvider } from './sms-provider';

const FLOW_URL = 'https://control.msg91.com/api/v5/flow';

interface Msg91Config {
  authKey: string;
  otpTemplateId: string;
  erasureTemplateId?: string;
}

/** MSG91 Flow API (DLT-registered templates are required for SMS in India). */
export class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';
  readonly isSimulated = false;

  constructor(private readonly config: Msg91Config) {}

  private async sendFlow(templateId: string, mobile: string, variables: Record<string, string>): Promise<void> {
    const response = await fetch(FLOW_URL, {
      method: 'POST',
      headers: { authkey: this.config.authKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ template_id: templateId, short_url: '0', recipients: [{ mobiles: `91${mobile}`, ...variables }] }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`MSG91 responded ${response.status}`);
    }
  }

  sendOtp(mobile: string, code: string): Promise<void> {
    return this.sendFlow(this.config.otpTemplateId, mobile, { otp: code });
  }

  async sendErasureNotice(mobile: string, erasureDate: Date): Promise<void> {
    if (!this.config.erasureTemplateId) {
      logger.warn('MSG91_ERASURE_TEMPLATE_ID is not set — erasure notice not sent');
      return;
    }
    await this.sendFlow(this.config.erasureTemplateId, mobile, { date: erasureDate.toLocaleDateString('en-IN') });
  }
}
