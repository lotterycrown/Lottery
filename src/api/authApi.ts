import type { AuthResponseDTO } from '../../shared/types/api';
import { apiRequest, authStorage } from './client';

export type MigrationPayload = {
  coins?: number;
  xp?: number;
  totalTaps?: number;
  completed?: boolean;
};

export const authenticateTelegram = async (initData: string, migration?: MigrationPayload) => {
  const data = await apiRequest<AuthResponseDTO>('/api/auth/telegram', {
    method: 'POST',
    auth: false,
    body: {
      initData,
      migration,
    },
  });

  authStorage.setToken(data.token);
  return data;
};
