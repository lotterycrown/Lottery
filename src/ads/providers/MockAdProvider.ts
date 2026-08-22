import { AdProvider, AdStatus, RewardedAdResult } from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockAdProvider implements AdProvider {
  private status: AdStatus = {
    initialized: false,
    available: false,
    provider: 'mock',
  };

  async initialize(): Promise<void> {
    this.status.initialized = true;
    this.status.available = import.meta.env.MODE !== 'production';
    this.status.reason = this.status.available ? undefined : 'Mock provider disabled in production';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.status.initialized) {
      await this.initialize();
    }
    return this.status.available;
  }

  async showRewardedAd(placementId: string): Promise<RewardedAdResult> {
    const available = await this.isAvailable();
    if (!available) {
      return {
        status: 'unavailable',
        provider: 'mock',
        placementId,
      };
    }

    await delay(1250);

    return {
      status: 'completed',
      provider: 'mock',
      placementId,
      transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  getStatus(): AdStatus {
    return this.status;
  }
}
