/**
 * Game state management hook.
 * Manages player progress, task state, rewards, and persistence.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GAME_CONFIG } from '../game/gameConfig';
import { Task } from '../game/taskConfig';
import { fromMicroUnits, toMicroUnits } from '../utils/money';
import { loadGameState, saveGameState } from '../utils/storage';
import { PersistedGameState } from '../utils/storageTypes';
import {
  LocalPlayerRepository,
  LocalRewardRepository,
  LocalTaskRepository,
  TaskManager,
} from '../services/repositories';

export const useGameState = () => {
  const [gameState, setGameState] = useState<PersistedGameState | null>(null);
  const [latestUnlockedTaskId, setLatestUnlockedTaskId] = useState<string | null>(null);
  const previousUnlockedTaskRef = useRef<string | null>(null);
  const gameStateRef = useRef<PersistedGameState | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const loaded = loadGameState();
    setGameState(loaded);
  }, []);

  useEffect(() => {
    if (gameState) {
      saveGameState(gameState);
    }
  }, [gameState]);

  useEffect(() => {
    const unlockedTaskId = gameState?.taskUnlockState.lastUnlockedTaskId ?? null;
    if (unlockedTaskId && previousUnlockedTaskRef.current !== unlockedTaskId) {
      setLatestUnlockedTaskId(unlockedTaskId);
      previousUnlockedTaskRef.current = unlockedTaskId;
    }
  }, [gameState?.taskUnlockState.lastUnlockedTaskId]);

  const getState = useCallback(() => {
    const current = gameStateRef.current;
    if (!current) {
      return loadGameState();
    }
    return current;
  }, []);

  const updateState = useCallback(
    (updater: (state: PersistedGameState) => PersistedGameState) => {
      setGameState((previous) => {
        const baseState = previous ?? loadGameState();
        const next = updater(baseState);
        gameStateRef.current = next;
        return next;
      });
    },
    []
  );

  const taskRepository = useMemo(
    () => new LocalTaskRepository(getState, updateState),
    [getState, updateState]
  );
  const playerRepository = useMemo(
    () => new LocalPlayerRepository(getState, updateState),
    [getState, updateState]
  );
  const rewardRepository = useMemo(() => new LocalRewardRepository(), []);
  const taskManager = useMemo(
    () => new TaskManager(taskRepository, playerRepository, rewardRepository),
    [taskRepository, playerRepository, rewardRepository]
  );

  const handleTap = useCallback(() => {
    let totalTapsAfter = 0;

    updateState((state) => {
      const tapRewardMicro = toMicroUnits(GAME_CONFIG.tapReward);
      totalTapsAfter = state.player.totalTaps + 1;
      const nextCoinsMicro = state.player.coinsMicroUnits + tapRewardMicro;

      return {
        ...state,
        player: {
          ...state.player,
          totalTaps: totalTapsAfter,
          coinsMicroUnits: nextCoinsMicro,
          coins: fromMicroUnits(nextCoinsMicro),
        },
      };
    });

    taskManager.registerValidTap(totalTapsAfter);
  }, [taskManager, updateState]);

  const claimTaskReward = useCallback(
    (taskId: string) => taskManager.claimTaskReward(taskId),
    [taskManager]
  );

  const markTasksPageOpened = useCallback(() => {
    taskManager.markTasksPageOpened();
  }, [taskManager]);

  const clearUnlockToast = useCallback(() => {
    setLatestUnlockedTaskId(null);
  }, []);

  const tasks = gameState?.tasks ?? [];
  const playerState = gameState?.player ?? null;

  const availableTasks = useMemo(
    () => tasks.filter((task) => task.status === 'available'),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((task) => task.status === 'in_progress'),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'completed'),
    [tasks]
  );
  const claimedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'claimed'),
    [tasks]
  );

  const hasUnreadTaskUnlock = gameState?.taskUnlockState.hasUnreadUnlock ?? false;

  return {
    playerState,
    tasks,
    availableTasks,
    inProgressTasks,
    completedTasks,
    claimedTasks,
    latestUnlockedTaskId,
    hasUnreadTaskUnlock,
    handleTap,
    claimTaskReward,
    markTasksPageOpened,
    clearUnlockToast,
  };
};

export type GameStateHook = ReturnType<typeof useGameState>;
export type TaskClaimResult = ReturnType<GameStateHook['claimTaskReward']>;
export type TaskCollection = Task[];
