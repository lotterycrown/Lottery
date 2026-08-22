import { useCallback, useMemo, useState } from 'react';
import { AdManager } from '../ads/AdManager';
import { AdApiClient } from '../ads/api/AdApiClient';
import { AdAvailability, AdConfig } from '../ads/types';

type UseAdRewardsState = {
  config: AdConfig | null;
  status: AdAvailability | null;
  loading: boolean;
  watching: boolean;
  message: string | null;
};

export const useAdRewards = () => {
  const manager = useMemo(() => new AdManager(), []);

  const [state, setState] = useState<UseAdRewardsState>({
    config: null,
    status: null,
    loading: false,
    watching: false,
    message: null,
  });

  const initialize = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, message: null }));

    try {
      const { config, status } = await manager.initialize();
      setState((prev) => ({ ...prev, loading: false, config, status }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        message: error instanceof Error ? error.message : 'Failed to initialize ads',
      }));
    }
  }, [manager]);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await manager.refreshStatus();
      setState((prev) => ({ ...prev, status }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        message: error instanceof Error ? error.message : 'Failed to refresh ad status',
      }));
    }
  }, [manager]);

  const watchAd = useCallback(async () => {
    setState((prev) => ({ ...prev, watching: true, message: null }));

    try {
      const outcome = await manager.watchAd();

      const status = manager.getStatus();
      setState((prev) => ({
        ...prev,
        watching: false,
        status,
        message:
          outcome.adResult.status === 'completed'
            ? 'Reward granted'
            : outcome.adResult.status === 'closed'
              ? 'Ad closed before completion'
              : outcome.adResult.status === 'unavailable'
                ? 'Ad unavailable right now'
                : 'Ad failed',
      }));

      return {
        ...outcome,
        rewardCoins: outcome.reward ? AdApiClient.microToCoins(outcome.reward.rewardMicro) : 0,
        rewardXp: outcome.reward?.rewardXp ?? 0,
      };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        watching: false,
        message: error instanceof Error ? error.message : 'Ad reward request failed',
      }));

      return null;
    }
  }, [manager]);

  return {
    ...state,
    initialize,
    refreshStatus,
    watchAd,
  };
};
