// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Fetch with error handling
 */
const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      console.error(`API Error: ${endpoint}`, data);
      return {
        success: false,
        error: data.error || 'Request failed',
        timestamp: Date.now(),
      };
    }

    return data;
  } catch (error) {
    console.error(`Fetch error: ${endpoint}`, error);
    return {
      success: false,
      error: 'Network error',
      timestamp: Date.now(),
    };
  }
};

/**
 * Authentication API
 */
export const authApi = {
  login: (initData: string) =>
    fetchApi<{
      token: string;
      user: {
        id: string;
        telegramId: string;
        balance: string;
        xp: string;
        level: number;
        crownTier: string;
        referralCode: string;
        role: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    }),

  getMe: () =>
    fetchApi<{
      id: string;
      telegramId: string;
      firstName?: string;
      lastName?: string;
      balance: string;
      xp: string;
      level: number;
      crownTier: string;
      totalTaps: string;
      referralCode: string;
      role: string;
      createdAt: string;
      lastLoginAt?: string;
    }>('/auth/me'),
};

/**
 * Gameplay API
 */
export const gameApi = {
  tap: (idempotencyKey: string, clientTimestamp: number) =>
    fetchApi<{
      transactionId: string;
      reward: string;
      xp: number;
      newBalance: string;
      newLevel: number;
      leveledUp: boolean;
    }>('/taps', {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey, clientTimestamp }),
    }),

  getTapHistory: (limit: number = 50) =>
    fetchApi<
      Array<{
        id: string;
        type: string;
        amount: string;
        balanceBefore: string;
        balanceAfter: string;
        createdAt: string;
      }>
    >(`/taps/history?limit=${limit}`),
};

/**
 * Task API
 */
export const taskApi = {
  getTasks: () =>
    fetchApi<
      Array<{
        id: string;
        title: string;
        description?: string;
        type: string;
        requirement: string;
        reward: string;
        xpReward: number;
        targetCount: number;
        progress?: {
          currentCount: number;
          completed: boolean;
          claimed: boolean;
          completedAt?: string;
          claimedAt?: string;
        };
      }>
    >('/tasks'),

  claimTask: (taskId: string, idempotencyKey: string) =>
    fetchApi<{
      transactionId: string;
      reward: string;
      xp: number;
      newBalance: string;
      newLevel: number;
      leveledUp: boolean;
    }>(`/tasks/${taskId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    }),
};

/**
 * Referral API
 */
export const referralApi = {
  getReferrals: () =>
    fetchApi<{
      referralCode: string;
      referralLink: string;
      stats: {
        total: number;
        qualified: number;
        rewarded: number;
      };
      referrals: Array<{
        id: string;
        status: string;
        qualifiedAt?: string;
        rewardClaimedAt?: string;
      }>;
    }>('/referrals'),

  acceptReferral: (referralCode: string) =>
    fetchApi<{
      referralId: string;
      status: string;
    }>(`/referrals/${referralCode}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

/**
 * Ad API
 */
export const adApi = {
  getAdConfig: () =>
    fetchApi<{
      provider: string;
      configured: boolean;
      note: string;
    }>('/ads/config'),

  recordAdView: (
    provider: string,
    adUnitId: string | undefined,
    clientVerificationToken: string | undefined,
    idempotencyKey: string
  ) =>
    fetchApi<{
      transactionId: string;
      reward: string;
      xp: number;
      newBalance: string;
      newLevel: number;
      leveledUp: boolean;
    }>('/ads/view', {
      method: 'POST',
      body: JSON.stringify({
        provider,
        adUnitId,
        clientVerificationToken,
        idempotencyKey,
      }),
    }),
};

/**
 * Admin API
 */
export const adminApi = {
  getConfig: () => fetchApi('/admin/config'),
  updateConfig: (key: string, value: any, reason?: string) =>
    fetchApi('/admin/config', {
      method: 'PATCH',
      body: JSON.stringify({ key, value, reason }),
    }),
  getAuditLogs: (limit: number = 50, offset: number = 0) =>
    fetchApi(`/admin/audit-logs?limit=${limit}&offset=${offset}`),
  getUsers: (limit: number = 50, offset: number = 0) =>
    fetchApi(`/admin/users?limit=${limit}&offset=${offset}`),
  getAnalytics: (startDate?: string, endDate?: string) => {
    let url = '/admin/analytics';
    const params = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length) url += '?' + params.join('&');
    return fetchApi(url);
  },
};

export default {
  authApi,
  gameApi,
  taskApi,
  referralApi,
  adApi,
  adminApi,
};
