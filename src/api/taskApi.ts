import type { ClientTask, GameStateDTO } from '../../shared/types/api';
import { apiRequest } from './client';

export const fetchTasks = () => apiRequest<ClientTask[]>('/api/tasks');

export const claimTask = (taskId: string) =>
  apiRequest<GameStateDTO>(`/api/tasks/${taskId}/claim`, {
    method: 'POST',
  });
