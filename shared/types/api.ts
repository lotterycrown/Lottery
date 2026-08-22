import type { CrownTier } from '../game/progression';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type ClientProgress = {
  coins: number;
  coinsMicro: number;
  xp: number;
  level: number;
  totalTaps: number;
  crownTier: CrownTier;
};

export type ClientTask = {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  rewardMicro: number;
  rewardXp: number;
  progress: number;
  status: string;
  unlockAfterTaps: number;
  unlockedAt: string | null;
  completedAt: string | null;
  claimedAt: string | null;
};

export type GameConfigDTO = {
  tapRewardMicro: number;
  xpPerTap: number;
  tapsRequiredToUnlockTask: number;
  percentageRewardEnabled: boolean;
  defaultPercentage: number;
};

export type GameStateDTO = {
  progress: ClientProgress;
  tasks: ClientTask[];
  config: GameConfigDTO;
};

export type AuthResponseDTO = {
  token: string;
  user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    photoUrl: string | null;
  };
  state: GameStateDTO;
};
