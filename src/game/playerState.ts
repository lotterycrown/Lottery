/**
 * Player progress data structure.
 */

import { GAME_CONFIG } from './gameConfig';
import { fromMicroUnits, toMicroUnits } from '../utils/money';

export interface PlayerProgress {
  level: number;
  xp: number;
  coins: number;
  coinsMicroUnits: number;
  totalTaps: number;
  crownTier: string;
}

/**
 * Initial player state.
 */
export const createInitialPlayerState = (
  config?: Partial<PlayerProgress>
): PlayerProgress => {
  const initialCoinsMicroUnits = toMicroUnits(GAME_CONFIG.initialCoins);

  return {
    level: GAME_CONFIG.initialLevel,
    xp: GAME_CONFIG.initialXP,
    coins: fromMicroUnits(initialCoinsMicroUnits),
    coinsMicroUnits: initialCoinsMicroUnits,
    totalTaps: GAME_CONFIG.initialTaps,
    crownTier: GAME_CONFIG.initialCrownTier,
    ...config,
  };
};
