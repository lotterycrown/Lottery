import { create } from 'zustand';
import { AUTH_TOKEN_KEY, authApi } from '../services/api';
import { AuthStoreState } from '../types';

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const setStoredToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

const clearStoredToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  loading: false,
  error: null,

  login: async (initData: string) => {
    set({ loading: true, error: null });

    const response = await authApi.login(initData);

    if (!response.success || !response.data) {
      set({ loading: false, error: response.error || 'Login failed' });
      return;
    }

    const { token } = response.data;
    setStoredToken(token);

    set({
      token,
      user: {
        ...response.data.user,
        totalTaps: response.data.user.totalTaps ?? '0',
      },
      loading: false,
      error: null,
    });
  },

  logout: () => {
    clearStoredToken();
    set({ token: null, user: null, loading: false, error: null });
  },

  loadUser: async () => {
    const token = get().token || getStoredToken();

    if (!token) {
      set({ user: null, loading: false, error: null });
      return;
    }

    if (token !== get().token) {
      set({ token });
    }

    set({ loading: true, error: null });
    const response = await authApi.getMe();

    if (!response.success || !response.data) {
      clearStoredToken();
      set({
        token: null,
        user: null,
        loading: false,
        error: response.error || 'Failed to load user',
      });
      return;
    }

    set({ user: response.data, loading: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
