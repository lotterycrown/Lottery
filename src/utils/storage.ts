/**
 * Local storage layer for player and task state persistence.
 * Handles safe loading, saving, migration, and error recovery.
 */

import {
  createInitialDailyTaskState,
  createInitialTaskUnlockState,
  createInitialTasks,
  Task,
} from '../game/taskConfig';
import { PlayerProgress, createInitialPlayerState } from '../game/playerState';
import { toMicroUnits, fromMicroUnits } from './money';
import { PersistedGameState } from './storageTypes';

const STORAGE_KEY = 'crown_tap_game_player_state';

const normalizePlayerState = (player: Partial<PlayerProgress>): PlayerProgress => {
  const initial = createInitialPlayerState();
  const coins = typeof player.coins === 'number' ? player.coins : initial.coins;
  const coinsMicroUnits =
    typeof player.coinsMicroUnits === 'number'
      ? player.coinsMicroUnits
      : toMicroUnits(coins);

  return {
    level: typeof player.level === 'number' ? player.level : initial.level,
    xp: typeof player.xp === 'number' ? player.xp : initial.xp,
    coins: fromMicroUnits(coinsMicroUnits),
    coinsMicroUnits,
    totalTaps: typeof player.totalTaps === 'number' ? player.totalTaps : initial.totalTaps,
    crownTier:
      typeof player.crownTier === 'string' ? player.crownTier : initial.crownTier,
  };
};

const normalizeTasks = (tasks: unknown): Task[] => {
  if (!Array.isArray(tasks)) {
    return createInitialTasks();
  }

  const fallback = createInitialTasks();

  return fallback.map((defaultTask) => {
    const savedTask = tasks.find(
      (task) => typeof task === 'object' && task !== null && (task as Task).id === defaultTask.id
    ) as Partial<Task> | undefined;

    if (!savedTask) {
      return defaultTask;
    }

    return {
      ...defaultTask,
      ...savedTask,
      progress:
        typeof savedTask.progress === 'number'
          ? Math.max(0, Math.min(savedTask.progress, defaultTask.target))
          : defaultTask.progress,
      status: savedTask.status ?? defaultTask.status,
    };
  });
};

const migrateLegacyPlayerOnlyState = (legacyState: Partial<PlayerProgress>): PersistedGameState => ({
  player: normalizePlayerState(legacyState),
  tasks: createInitialTasks(),
  taskUnlockState: createInitialTaskUnlockState(),
  dailyTaskState: createInitialDailyTaskState(),
});

const createInitialGameState = (): PersistedGameState => ({
  player: createInitialPlayerState(),
  tasks: createInitialTasks(),
  taskUnlockState: createInitialTaskUnlockState(),
  dailyTaskState: createInitialDailyTaskState(),
});

/**
 * Load game state from localStorage.
 * Returns initial state if storage is corrupted or missing.
 */
export const loadGameState = (): PersistedGameState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialGameState();
    }

    const parsed = JSON.parse(stored) as Partial<PersistedGameState> &
      Partial<PlayerProgress>;

    if (parsed.player) {
      return {
        player: normalizePlayerState(parsed.player),
        tasks: normalizeTasks(parsed.tasks),
        taskUnlockState: {
          ...createInitialTaskUnlockState(),
          ...(parsed.taskUnlockState ?? {}),
        },
        dailyTaskState: {
          ...createInitialDailyTaskState(),
          ...(parsed.dailyTaskState ?? {}),
        },
      };
    }

    return migrateLegacyPlayerOnlyState(parsed);
  } catch (error) {
    console.warn('Failed to load game state from localStorage:', error);
    return createInitialGameState();
  }
};

/**
 * Save game state to localStorage.
 */
export const saveGameState = (state: PersistedGameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state to localStorage:', error);
  }
};

/**
 * Legacy helper: load only player state.
 */
export const loadPlayerState = (): PlayerProgress => loadGameState().player;

/**
 * Legacy helper: save only player state while preserving task data.
 */
export const savePlayerState = (player: PlayerProgress): void => {
  const current = loadGameState();
  saveGameState({
    ...current,
    player: normalizePlayerState(player),
  });
};

/**
 * Reset player and task state to initial values.
 */
export const resetPlayerState = (): PlayerProgress => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset player state:', error);
  }
  return createInitialPlayerState();
};
