/**
 * Game state management hook.
 * Manages player progress and persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { PlayerProgress, createInitialPlayerState } from '../game/playerState';
import { loadPlayerState, savePlayerState } from '../utils/storage';
import { GAME_CONFIG } from '../game/gameConfig';
import { addMicroUnits } from '../utils/decimal';

export const useGameState = () => {
  const [playerState, setPlayerState] = useState<PlayerProgress | null>(null);

  // Load initial state from storage
  useEffect(() => {
    const loaded = loadPlayerState();
    setPlayerState(loaded);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (playerState) {
      savePlayerState(playerState);
    }
  }, [playerState]);

  const addCoins = useCallback((amount: bigint) => {
    setPlayerState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        coinsMicroUnits: addMicroUnits(prev.coinsMicroUnits, amount),
      };
    });
  }, []);

  const incrementTaps = useCallback(() => {
    setPlayerState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalTaps: prev.totalTaps + 1,
      };
    });
  }, []);

  const handleTap = useCallback(() => {
    addCoins(GAME_CONFIG.tapRewardMicroUnits);
    incrementTaps();
  }, [addCoins, incrementTaps]);

  const reset = useCallback(() => {
    setPlayerState(createInitialPlayerState());
  }, []);

  return {
    playerState,
    handleTap,
    addCoins,
    incrementTaps,
    reset,
  };
};
