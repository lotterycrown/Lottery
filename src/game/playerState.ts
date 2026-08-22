/**
 * Player progress data structure.
 */

export interface PlayerProgress {
  level: number;
  xp: number;
  coinsMicroUnits: bigint;
  totalTaps: number;
  crownTier: string;
}

/**
 * Initial player state.
 */
export const createInitialPlayerState = (config?: Partial<PlayerProgress>): PlayerProgress => ({
  level: 1,
  xp: 0,
  coinsMicroUnits: 0n,
  totalTaps: 0,
  crownTier: 'bronze_1',
  ...config,
});
