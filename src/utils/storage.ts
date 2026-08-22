/**
 * Local storage layer for player state persistence.
 * Handles safe loading, saving, and error recovery.
 */

import { PlayerProgress, createInitialPlayerState } from '../game/playerState';

const STORAGE_KEY = 'crown_tap_game_player_state';
const STORAGE_VERSION = 1;

interface SerializedPlayerState {
  version: number;
  level: number;
  xp: number;
  coinsMicroUnits: string;
  totalTaps: number;
  crownTier: string;
}

const isValidSerializedPlayerState = (
  value: unknown
): value is SerializedPlayerState => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    candidate.version === STORAGE_VERSION &&
    Number.isInteger(candidate.level) &&
    Number.isInteger(candidate.xp) &&
    typeof candidate.coinsMicroUnits === 'string' &&
    /^\d+$/.test(candidate.coinsMicroUnits) &&
    Number.isInteger(candidate.totalTaps) &&
    typeof candidate.crownTier === 'string' &&
    /^[a-z0-9_]{1,32}$/i.test(candidate.crownTier) &&
    (candidate.level as number) >= 1 &&
    (candidate.xp as number) >= 0 &&
    (candidate.totalTaps as number) >= 0
  );
};

/**
 * Load player state from localStorage.
 * Returns initial state if storage is corrupted or missing.
 */
export const loadPlayerState = (): PlayerProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialPlayerState();
    }
    const parsed = JSON.parse(stored);
    if (isValidSerializedPlayerState(parsed)) {
      return createInitialPlayerState({
        level: parsed.level,
        xp: parsed.xp,
        coinsMicroUnits: BigInt(parsed.coinsMicroUnits),
        totalTaps: parsed.totalTaps,
        crownTier: parsed.crownTier,
      });
    }
    return createInitialPlayerState();
  } catch {
    return createInitialPlayerState();
  }
};

/**
 * Save player state to localStorage.
 */
export const savePlayerState = (state: PlayerProgress): void => {
  try {
    const serializedState: SerializedPlayerState = {
      version: STORAGE_VERSION,
      level: state.level,
      xp: state.xp,
      coinsMicroUnits: state.coinsMicroUnits.toString(),
      totalTaps: state.totalTaps,
      crownTier: state.crownTier,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedState));
  } catch {}
};

/**
 * Reset player state to initial values.
 */
export const resetPlayerState = (): PlayerProgress => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return createInitialPlayerState();
};
