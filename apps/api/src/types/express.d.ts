import type { AdminRole } from '@sajag/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAdmin() */
      admin?: { id: string; role: AdminRole };
      /** Set by requireDataSubject() after OTP verification */
      dataSubject?: { mobileHash: string };
    }
  }
}

export {};
