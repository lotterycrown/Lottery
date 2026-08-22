export type VerificationResult =
  | { status: 'valid'; raw?: Record<string, unknown> }
  | { status: 'invalid'; reason: string }
  | { status: 'unverifiable'; reason: string };

export type RewardRequest = {
  adSessionId: string;
  provider: 'mock' | 'telegram';
  verificationToken?: string;
  transactionId?: string;
};
