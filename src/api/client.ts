import type { ApiResponse } from '../../shared/types/api';

const API_TIMEOUT_MS = 8000;
const API_RETRIES = 1;
const TOKEN_KEY = 'crown_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  auth?: boolean;
  retries?: number;
  signal?: AbortSignal;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const withTimeout = async (input: RequestInfo | URL, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;

  try {
    return await fetch(input, { ...init, signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, auth = true, retries = API_RETRIES, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = authStorage.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    headers.Authorization = ['Bearer', token].join(' ');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await withTimeout(
        `${API_BASE}${path}`,
        {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal,
        },
        API_TIMEOUT_MS,
      );

      const json = (await response.json()) as ApiResponse<T>;
      if (!json.success) {
        if (response.status === 401) {
          authStorage.clear();
        }
        throw new Error(json.error.message);
      }

      return json.data;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed');
};
