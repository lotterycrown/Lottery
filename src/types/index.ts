export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: number;
}

export type UserRole = 'user' | 'admin' | string;

export interface User {
  id: string;
  telegramId: string;
  firstName?: string | null;
  lastName?: string | null;
  balance: string;
  xp: string;
  level: number;
  crownTier: string;
  totalTaps: string;
  referralCode: string;
  role: UserRole;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'totalTaps'> & { totalTaps?: string };
}

export interface TapResponse {
  transactionId: string;
  reward: string;
  xp: number;
  newBalance: string;
  newLevel: number;
  leveledUp: boolean;
}

export interface TaskClaimResponse {
  transactionId: string;
  reward: string;
  xp: number;
  newBalance: string;
  newLevel?: number;
  leveledUp?: boolean;
  duplicate?: boolean;
}

export interface TransactionHistoryItem {
  id: string;
  type: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export interface TaskProgress {
  currentCount: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: string;
  claimedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  requirement: string;
  reward: string;
  xpReward: number;
  targetCount: number;
  progress: TaskProgress | null;
}

export interface ReferralRecord {
  id: string;
  status: string;
  qualifiedAt?: string;
  rewardClaimedAt?: string;
  createdAt?: string;
}

export interface ReferralStats {
  total: number;
  qualified: number;
  rewarded: number;
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats;
  referrals: ReferralRecord[];
}

export interface ReferralAcceptResponse {
  referralId: string;
  status: string;
}

export interface AdConfig {
  provider: string;
  configured: boolean;
  note: string;
}

export interface AdminConfig {
  id: string;
  tapReward: string;
  taskRewardSmall: string;
  taskRewardMedium: string;
  taskRewardLarge: string;
  adReward: string;
  referralReward: string;
  referralBonusReward: string;
  xpPerTap: number;
  xpPerTaskSmall: number;
  xpPerTaskMedium: number;
  xpPerTaskLarge: number;
  xpPerAd: number;
  maxTapsPerHour: number;
  tapCooldownMs: number;
  taskClaimCooldownHours: number;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminConfigUpdateResponse {
  key: string;
  previousValue: string | number | boolean | null;
  newValue: string | number | boolean;
  config: AdminConfig;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface AdminAuditLogsResponse extends PaginationMeta {
  logs: AuditLog[];
}

export interface AdminUser {
  id: string;
  telegramId: string;
  firstName?: string | null;
  lastName?: string | null;
  balance: string;
  xp: string;
  level: number;
  crownTier: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUsersResponse extends PaginationMeta {
  users: AdminUser[];
}

export interface AnalyticsDaily {
  id: string;
  date: string;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
  totalTaps: string | number;
  totalTasksClaimed: string | number;
  totalAdsWatched: string | number;
  totalRewardsPaid: string | number;
  averageBalance: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnalyticsSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
  totalTaps: number;
  totalTasksClaimed: number;
  totalAdsWatched: number;
  totalRewardsPaid: number;
  averageBalance: number;
}

export interface AdminAnalyticsResponse {
  summary: AnalyticsSummary;
  daily: AnalyticsDaily[];
}

export interface AuthStoreState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export interface GameStoreState {
  balance: bigint;
  xp: bigint;
  level: number;
  crownTier: string;
  totalTaps: bigint;
  loading: boolean;
  error: string | null;
  pendingReward: boolean;
  tap: () => Promise<boolean>;
  syncBalance: (balance: string, xp: string, level: number, crownTier: string, totalTaps: string) => void;
  clearError: () => void;
}
