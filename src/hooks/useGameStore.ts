import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { authApi, gameApi } from '../services/api';
import { GameStoreState } from '../types';

export const useGameStore = create<GameStoreState>((set) => ({
  balance: BigInt(0),
  xp: BigInt(0),
  level: 1,
  crownTier: 'bronze_1',
  totalTaps: BigInt(0),
  loading: false,
  error: null,
  pendingReward: false,

  tap: async () => {
    set({ pendingReward: true, error: null });

    try {
      const response = await gameApi.tap(uuidv4(), Date.now());

      if (!response.success || !response.data) {
        set({ pendingReward: false, error: response.error || 'Tap failed' });
        return;
      }
      const tapData = response.data;

      const meResponse = await authApi.getMe();

      if (meResponse.success && meResponse.data) {
        set({
          balance: BigInt(meResponse.data.balance),
          xp: BigInt(meResponse.data.xp),
          level: meResponse.data.level,
          crownTier: meResponse.data.crownTier,
          totalTaps: BigInt(meResponse.data.totalTaps ?? '0'),
          pendingReward: false,
          error: null,
        });
        return;
      }

      set((state) => ({
        balance: BigInt(tapData.newBalance),
        level: tapData.newLevel,
        xp: state.xp,
        crownTier: state.crownTier,
        totalTaps: state.totalTaps,
        pendingReward: false,
        error: meResponse.error || null,
      }));
    } catch (error) {
      set({
        pendingReward: false,
        error: error instanceof Error ? error.message : 'Tap failed',
      });
    }
  },

  syncBalance: (balance: string, xp: string, level: number, crownTier: string, totalTaps: string) => {
    set({
      balance: BigInt(balance),
      xp: BigInt(xp),
      level,
      crownTier,
      totalTaps: BigInt(totalTaps),
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
