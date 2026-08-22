import { Referral, ReferralCode, ReferralConfig, ReferralProgress } from '../types';
import { secureId } from '../random';

export interface ReferralServiceStore {
  findCodeByValue(code: string): Promise<ReferralCode | null>;
  findReferralByReferredUserId(referredUserId: string): Promise<Referral | null>;
  findReferralByRelationship(referrerId: string, referredUserId: string): Promise<Referral | null>;
  countDailyReferralsByReferrer(referrerId: string, dayStart: Date): Promise<number>;
  createReferral(input: Omit<Referral, 'createdAt' | 'qualifiedAt' | 'rewardedAt'>): Promise<Referral>;
  updateReferral(referralId: string, patch: Partial<Referral>): Promise<Referral>;
  findReferralById(referralId: string): Promise<Referral | null>;
  getProgress(userId: string): Promise<ReferralProgress>;
}

const createReferralId = () => secureId('ref');

export class ReferralService {
  constructor(
    private readonly store: ReferralServiceStore,
    private readonly configProvider: () => Promise<ReferralConfig>,
  ) {}

  validateReferral(referrerId: string, referredUserId: string): void {
    if (referrerId === referredUserId) {
      throw new Error('Self-referral is not allowed');
    }
  }

  async registerReferral(code: string, referredUserId: string): Promise<Referral> {
    const config = await this.configProvider();
    if (!config.enabled) {
      throw new Error('Referral program is disabled');
    }

    const referralCode = await this.store.findCodeByValue(code);
    if (!referralCode || !referralCode.isActive) {
      throw new Error('Invalid or inactive referral code');
    }

    this.validateReferral(referralCode.userId, referredUserId);

    const existingForUser = await this.store.findReferralByReferredUserId(referredUserId);
    if (existingForUser) {
      throw new Error('Referred user already has a referrer');
    }

    const existingRelationship = await this.store.findReferralByRelationship(
      referralCode.userId,
      referredUserId,
    );
    if (existingRelationship) {
      throw new Error('Duplicate referral relationship');
    }

    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const countToday = await this.store.countDailyReferralsByReferrer(referralCode.userId, dayStart);
    if (countToday >= config.maxReferralsPerDay) {
      throw new Error('Daily referral limit reached');
    }

    return this.store.createReferral({
      id: createReferralId(),
      referrerId: referralCode.userId,
      referredUserId,
      referralCodeId: referralCode.id,
      status: 'PENDING',
    });
  }

  async checkQualification(referredUserId: string): Promise<boolean> {
    const referral = await this.store.findReferralByReferredUserId(referredUserId);
    if (!referral || referral.status !== 'PENDING') {
      return false;
    }

    const config = await this.configProvider();
    const progress = await this.store.getProgress(referredUserId);
    const requirement = config.qualificationRequirement;

    return (
      progress.currentTaps >= requirement.minimumTaps &&
      progress.currentLevel >= requirement.minimumLevel &&
      (!requirement.completeFirstTask || progress.taskCompleted)
    );
  }

  async qualifyReferral(referralId: string): Promise<Referral> {
    const referral = await this.store.findReferralById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== 'PENDING') {
      return referral;
    }

    const qualified = await this.checkQualification(referral.referredUserId);
    if (!qualified) {
      throw new Error('Referral does not meet qualification requirements');
    }

    return this.store.updateReferral(referral.id, {
      status: 'QUALIFIED',
      qualifiedAt: new Date(),
    });
  }
}
