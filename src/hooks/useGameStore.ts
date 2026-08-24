import { create } from 'zustand';
import { gameApi } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface GameState {
  balance: bigint;
  xp: bigint;
  level: number;
  crownTier: string;
  totalTaps: bigint;
  loading: boolean;
  error: string | null;
  pendingReward: boolean;

  tap: () => Promise<void>;
  syncBalance: (balance: string, xp: string, level: number, crownTier: string, totalTaps: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
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
      const idempotencyKey = uuidv4();
      const clientTimestamp = Date.now();

      const response = await gameApi.tap(idempotencyKey, clientTimestamp);
      const data = response.data;
      if (response.success && data) {
        set((state) => ({
          balance: BigInt(data.newBalance),
          xp: state.xp + BigInt(data.xp),
          level: data.newLevel,
          totalTaps: state.totalTaps + BigInt(1),
          pendingReward: false,
        }));
      } else {
        set({ error: response.error || 'Tap failed', pendingReward: false });
      }
    } catch {
      set({ error: 'Network error', pendingReward: false });
    }
  },

  syncBalance: (balance: string, xp: string, level: number, crownTier: string, totalTaps: string) => {
    set({
      balance: BigInt(balance),
      xp: BigInt(xp),
      level,
      crownTier,
      totalTaps: BigInt(totalTaps),
    });
  },
}));
