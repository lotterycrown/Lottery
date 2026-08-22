import { AdApiClient } from './api/AdApiClient';
import { createAdProvider } from './providers/factory';
import { AdAvailability, AdConfig, AdProvider, AdProviderName, AdRewardResponse, RewardedAdResult } from './types';

export type WatchAdOutcome = {
  adResult: RewardedAdResult;
  reward?: AdRewardResponse;
};

export class AdManager {
  private config: AdConfig | null = null;
  private status: AdAvailability | null = null;
  private provider: AdProvider | null = null;
  private providerName: AdProviderName | null = null;

  constructor(private readonly api = new AdApiClient()) {}

  private async ensureProvider(providerName: AdProviderName): Promise<AdProvider> {
    if (!this.provider || this.providerName !== providerName) {
      this.provider = createAdProvider(providerName);
      this.providerName = providerName;
      await this.provider.initialize();
    }

    return this.provider;
  }

  async initialize(): Promise<{ config: AdConfig; status: AdAvailability }> {
    this.config = await this.api.getConfig();
    await this.ensureProvider(this.config.provider);
    this.status = await this.api.getStatus();

    return {
      config: this.config,
      status: this.status,
    };
  }

  async refreshStatus(): Promise<AdAvailability> {
    this.status = await this.api.getStatus();
    return this.status;
  }

  getConfig(): AdConfig | null {
    return this.config;
  }

  getStatus(): AdAvailability | null {
    return this.status;
  }

  async watchAd(): Promise<WatchAdOutcome> {
    if (!this.config) {
      await this.initialize();
    }

    const session = await this.api.createSession();
    const provider = await this.ensureProvider(session.provider);
    const adResult = await provider.showRewardedAd(session.placementId);

    if (adResult.status !== 'completed') {
      this.status = await this.api.getStatus();
      return { adResult };
    }

    const reward = await this.api.submitReward({
      adSessionId: session.adSessionId,
      provider: session.provider,
      verificationToken: adResult.transactionId,
      transactionId: adResult.transactionId,
    });

    this.status = await this.api.getStatus();

    return {
      adResult,
      reward,
    };
  }
}
