/**
 * Game state adapter hook.
 * Bridges server-authoritative Zustand state to UI shape.
 */

import { useMemo } from 'react';
import { PlayerProgress } from '../game/playerState';
import { useGameStore } from './useGameStore';

const bigintToNumber = (value: bigint): number => Number(value) / 1_000_000;

export const useGameState = () => {
  const { balance, xp, level, crownTier, totalTaps, tap } = useGameStore();

  const playerState = useMemo<PlayerProgress>(() => ({
    level,
    xp: bigintToNumber(xp),
    coins: bigintToNumber(balance),
    totalTaps: Number(totalTaps),
    crownTier,
  }), [balance, xp, level, crownTier, totalTaps]);

  const handleTap = () => {
    void tap();
  };

  return {
    playerState,
    handleTap,
  };
};
