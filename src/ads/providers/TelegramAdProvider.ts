import { AdProvider, AdStatus, RewardedAdResult } from '../types';

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      showPopup?: (params: { title?: string; message: string; buttons?: Array<{ type: 'ok' }> }) => void;
    };
  };
};

export class TelegramAdProvider implements AdProvider {
  private status: AdStatus = {
    initialized: false,
    available: false,
    provider: 'telegram',
    reason: 'Telegram rewarded ads are not available in this client runtime',
  };

  async initialize(): Promise<void> {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    this.status.initialized = true;
    this.status.available = Boolean(tg);
    this.status.reason = this.status.available
      ? 'Server-side verification required before production use'
      : 'Telegram WebApp context not detected';
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
        provider: 'telegram',
        placementId,
      };
    }

    const tg = (window as TelegramWindow).Telegram?.WebApp;
    tg?.showPopup?.({
      title: 'Ads unavailable',
      message: 'Telegram rewarded ads are pending official provider verification support.',
      buttons: [{ type: 'ok' }],
    });

    return {
      status: 'failed',
      provider: 'telegram',
      placementId,
    };
  }

  getStatus(): AdStatus {
    return this.status;
  }
}
