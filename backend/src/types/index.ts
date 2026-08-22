import { Request } from 'express';

// User types
export interface AuthenticatedUser {
  id: string;
  telegramId: bigint;
  role: 'user' | 'admin';
  balance: bigint;
  xp: bigint;
  level: number;
  crownTier: string;
}

export interface JWTPayload {
  userId: string;
  telegramId: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

// Request context
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  clientIp?: string;
}

// Reward types
export interface RewardResult {
  success: boolean;
  amount: bigint;
  xp: number;
  newBalance: bigint;
  newLevel: number;
  leveledUp: boolean;
  transactionId: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
