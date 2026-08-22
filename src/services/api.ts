import {
  AdConfig,
  AdminAnalyticsResponse,
  AdminAuditLogsResponse,
  AdminConfig,
  AdminConfigUpdateResponse,
  AdminUsersResponse,
  ApiResponse,
  LoginResponse,
  ReferralAcceptResponse,
  ReferralInfo,
  TapResponse,
  Task,
  TaskClaimResponse,
  TransactionHistoryItem,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_TOKEN_KEY = 'auth_token';

type Primitive = string | number | boolean;

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = getAuthToken();

  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

    if (!response.ok) {
      return {
        success: false,
        error: payload?.error || `Request failed with status ${response.status}`,
        code: payload?.code,
        timestamp: payload?.timestamp ?? Date.now(),
      };
    }

    if (payload?.success === false) {
      return {
        success: false,
        error: payload.error || 'Request failed',
        code: payload.code,
        timestamp: payload.timestamp ?? Date.now(),
      };
    }

    if (!payload) {
      return {
        success: false,
        error: 'Invalid server response',
        timestamp: Date.now(),
      };
    }

    return payload;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      timestamp: Date.now(),
    };
  }
};

const toQueryString = (params: Record<string, Primitive | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

export const authApi = {
  login: (initData: string) =>
    fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),

  getMe: () => fetchApi<User>('/auth/me'),
};

export const gameApi = {
  tap: (idempotencyKey: string, clientTimestamp: number) =>
    fetchApi<TapResponse>('/taps', {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey, clientTimestamp }),
    }),

  getTapHistory: (limit = 50) =>
    fetchApi<TransactionHistoryItem[]>(`/taps/history${toQueryString({ limit })}`),
};

export const taskApi = {
  getTasks: () => fetchApi<Task[]>('/tasks'),

  claimTask: (taskId: string, idempotencyKey: string) =>
    fetchApi<TaskClaimResponse>(`/tasks/${taskId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    }),
};

export const referralApi = {
  getReferrals: () => fetchApi<ReferralInfo>('/referrals'),

  acceptReferral: (code: string) =>
    fetchApi<ReferralAcceptResponse>(`/referrals/${code}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  checkQualification: () =>
    fetchApi<{ referrals: ReferralInfo['referrals'] }>('/referrals/check-qualification', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

export const adApi = {
  getAdConfig: () => fetchApi<AdConfig>('/ads/config'),

  recordAdView: (provider: string, adUnitId: string | undefined, clientVerificationToken: string | undefined, idempotencyKey: string) =>
    fetchApi<TapResponse>('/ads/view', {
      method: 'POST',
      body: JSON.stringify({ provider, adUnitId, clientVerificationToken, idempotencyKey }),
    }),
};

export const adminApi = {
  getConfig: () => fetchApi<AdminConfig>('/admin/config'),

  updateConfig: (key: string, value: Primitive, reason?: string) =>
    fetchApi<AdminConfigUpdateResponse>('/admin/config', {
      method: 'PATCH',
      body: JSON.stringify({ key, value, reason }),
    }),

  getAuditLogs: (limit = 50, offset = 0) =>
    fetchApi<AdminAuditLogsResponse>(`/admin/audit-logs${toQueryString({ limit, offset })}`),

  getUsers: (limit = 50, offset = 0) =>
    fetchApi<AdminUsersResponse>(`/admin/users${toQueryString({ limit, offset })}`),

  getAnalytics: (startDate?: string, endDate?: string) =>
    fetchApi<AdminAnalyticsResponse>(`/admin/analytics${toQueryString({ startDate, endDate })}`),
};

export { AUTH_TOKEN_KEY };

export default {
  authApi,
  gameApi,
  taskApi,
  referralApi,
  adApi,
  adminApi,
};
