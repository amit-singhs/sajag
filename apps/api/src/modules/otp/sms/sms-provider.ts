/** Strategy interface for outbound SMS; swap providers through SMS_PROVIDER without touching callers. */
export interface SmsProvider {
  readonly name: string;
  /** True when codes are only logged (local development) — never in production. */
  readonly isSimulated: boolean;
  sendOtp(mobile: string, code: string): Promise<void>;
}
