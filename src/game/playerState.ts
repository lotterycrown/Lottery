/**
 * Player progress data structure.
 */

export interface PlayerProgress {
  level: number;
  xp: number;
  coins: number;
  totalTaps: number;
  crownTier: string;
}

/**
 * Initial player state.
 */
export const createInitialPlayerState = (config?: Partial<PlayerProgress>): PlayerProgress => ({
  level: 1,
  xp: 0,
  coins: 0,
  totalTaps: 0,
  crownTier: 'bronze_1',
  ...config,
});
