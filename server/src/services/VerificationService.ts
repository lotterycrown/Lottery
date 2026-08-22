import { assertProviderAllowedForEnvironment } from '../config/adConfig';
import { VerificationResult } from '../types/ads';

export class VerificationService {
  async verifyRewardedAd(input: {
    provider: 'mock' | 'telegram';
    verificationToken?: string;
    transactionId?: string;
  }): Promise<VerificationResult> {
    assertProviderAllowedForEnvironment(input.provider);

    if (input.provider === 'mock') {
      if (process.env.NODE_ENV === 'production') {
        return { status: 'invalid', reason: 'Mock provider disabled in production' };
      }

      return {
        status: 'valid',
        raw: {
          verificationToken: input.verificationToken,
          transactionId: input.transactionId,
        },
      };
    }

    return {
      status: 'unverifiable',
      reason: 'Telegram rewarded ads require official server verification API support',
    };
  }
}
