/**
 * Local storage layer for player state persistence.
 * Handles safe loading, saving, and error recovery.
 */

import { PlayerProgress, createInitialPlayerState } from '../game/playerState';

const STORAGE_KEY = 'crown_tap_game_player_state';

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
    // Validate structure
    if (
      typeof parsed.level === 'number' &&
      typeof parsed.xp === 'number' &&
      typeof parsed.coins === 'number' &&
      typeof parsed.totalTaps === 'number' &&
      typeof parsed.crownTier === 'string'
    ) {
      return parsed;
    }
    return createInitialPlayerState();
  } catch (error) {
    console.warn('Failed to load player state from localStorage:', error);
    return createInitialPlayerState();
  }
};

/**
 * Save player state to localStorage.
 */
export const savePlayerState = (state: PlayerProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player state to localStorage:', error);
  }
};

/**
 * Reset player state to initial values.
 */
export const resetPlayerState = (): PlayerProgress => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset player state:', error);
  }
  return createInitialPlayerState();
};
