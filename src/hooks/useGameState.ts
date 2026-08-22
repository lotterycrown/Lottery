import { useCallback, useEffect, useState } from 'react';
import { authenticateTelegram } from '../api/authApi';
import { fetchGameState, submitTap } from '../api/gameApi';
import type { ClientTask, GameStateDTO } from '../../shared/types/api';
import type { PlayerProgress } from '../game/playerState';
import { getTelegramInitData } from '../utils/telegram';
import { getMigrationCandidate, markMigrationComplete, savePlayerState } from '../utils/storage';

const toPlayerProgress = (state: GameStateDTO): PlayerProgress => ({
  level: state.progress.level,
  xp: state.progress.xp,
  coins: state.progress.coins,
  coinsMicro: state.progress.coinsMicro,
  totalTaps: state.progress.totalTaps,
  crownTier: state.progress.crownTier,
});

export const useGameState = () => {
  const [playerState, setPlayerState] = useState<PlayerProgress | null>(null);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrateFromServerState = useCallback((state: GameStateDTO) => {
    const mapped = toPlayerProgress(state);
    setPlayerState(mapped);
    setTasks(state.tasks);
    savePlayerState(mapped);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      try {
        const initData = getTelegramInitData();
        const migration = getMigrationCandidate();
        const auth = await authenticateTelegram(initData, migration);
        if (migration?.completed) {
          markMigrationComplete();
        }
        hydrateFromServerState(auth.state);
      } catch {
        try {
          const state = await fetchGameState();
          hydrateFromServerState(state);
        } catch (bootstrapError) {
          setError(bootstrapError instanceof Error ? bootstrapError.message : 'Failed to initialize game');
          setIsLoading(false);
        }
      }
    };

    void bootstrap();
  }, [hydrateFromServerState]);

  const handleTap = useCallback(async () => {
    if (!playerState) {
      return;
    }

    const requestId = crypto.randomUUID();

    try {
      const state = await submitTap(requestId);
      hydrateFromServerState(state);
    } catch (tapError) {
      setError(tapError instanceof Error ? tapError.message : 'Tap failed');
    }
  }, [hydrateFromServerState, playerState]);

  return {
    playerState,
    tasks,
    isLoading,
    error,
    setError,
    hydrateFromServerState,
    handleTap,
  };
};
