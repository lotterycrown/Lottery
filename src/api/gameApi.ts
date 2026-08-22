import type { GameConfigDTO, GameStateDTO } from '../../shared/types/api';
import { apiRequest } from './client';

export const fetchGameState = () => apiRequest<GameStateDTO>('/api/game/state');

export const fetchGameConfig = () => apiRequest<GameConfigDTO>('/api/game/config');

export const submitTap = (requestId: string) =>
  apiRequest<GameStateDTO>('/api/game/tap', {
    method: 'POST',
    body: { requestId },
  });
