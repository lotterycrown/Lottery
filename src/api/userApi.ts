import { apiRequest } from './client';

export type MeResponse = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
};

export const fetchMe = () => apiRequest<MeResponse>('/api/me');
