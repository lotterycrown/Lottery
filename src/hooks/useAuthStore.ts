import { create } from 'zustand';
import { authApi } from '../services/api';

interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  error: string | null;

  login: (initData: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!) : null,
  loading: false,
  error: null,

  login: async (initData: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login(initData);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        set({ token, user, loading: false });
      } else {
        set({ error: response.error || 'Login failed', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error during login', loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    set({ token: null, user: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    set({ loading: true });
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        localStorage.setItem('user_data', JSON.stringify(response.data));
        set({ user: response.data, loading: false });
      } else {
        set({ error: 'Failed to load user', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error', loading: false });
    }
  },
}));
