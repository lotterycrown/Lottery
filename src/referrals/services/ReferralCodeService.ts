import { generateReferralCode } from '../generateReferralCode';
import { secureId } from '../random';
import { referralCodeSchema } from '../validation';
import { ReferralCode } from '../types';

export interface ReferralCodeRepository {
  findByUserId(userId: string): Promise<ReferralCode | null>;
  findByCode(code: string): Promise<ReferralCode | null>;
  create(data: Omit<ReferralCode, 'id' | 'createdAt'>): Promise<ReferralCode>;
}

const createId = () => secureId('ref_code');

export class ReferralCodeService {
  constructor(private readonly repository: ReferralCodeRepository) {}

  async generateCode(userId: string): Promise<string> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      return existing.code;
    }

    const code = await generateReferralCode(async (candidate) => {
      const found = await this.repository.findByCode(candidate);
      return !found;
    });

    await this.repository.create({
      userId,
      code,
      isActive: true,
    });

    return code;
  }

  async getReferralCode(userId: string): Promise<ReferralCode> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const code = await this.generateCode(userId);
    const generated = await this.repository.findByCode(code);
    if (!generated) {
      throw new Error('Failed to persist generated referral code');
    }

    return generated;
  }

  async validateCode(code: string): Promise<boolean> {
    if (!referralCodeSchema.safeParse(code).success) {
      return false;
    }

    const found = await this.repository.findByCode(code);
    return !!found?.isActive;
  }
}
