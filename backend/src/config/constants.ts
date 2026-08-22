export const CONSTANTS = {
  // Micro-units: 1,000,000 micro-units = 1 coin
  COIN_DECIMALS: 6,
  COIN_MULTIPLIER: 1_000_000,

  // Default reward values (in micro-units)
  DEFAULT_TAP_REWARD: 1_000, // 0.001 coins
  DEFAULT_TASK_REWARD_SMALL: 50_000,
  DEFAULT_TASK_REWARD_MEDIUM: 100_000,
  DEFAULT_TASK_REWARD_LARGE: 250_000,
  DEFAULT_AD_REWARD: 10_000,
  DEFAULT_REFERRAL_REWARD: 500_000,
  DEFAULT_REFERRAL_BONUS_REWARD: 1_000_000,

  // XP defaults
  DEFAULT_XP_PER_TAP: 1,
  DEFAULT_XP_PER_TASK_SMALL: 10,
  DEFAULT_XP_PER_TASK_MEDIUM: 25,
  DEFAULT_XP_PER_TASK_LARGE: 50,
  DEFAULT_XP_PER_AD: 5,

  // Rate limiting
  DEFAULT_MAX_TAPS_PER_HOUR: 3600,
  DEFAULT_TAP_COOLDOWN_MS: 100,
  DEFAULT_TASK_CLAIM_COOLDOWN_HOURS: 24,

  // Crown tiers (mapped from level)
  CROWN_TIERS: [
    { name: 'bronze_1', minLevel: 1, maxLevel: 4 },
    { name: 'bronze_2', minLevel: 5, maxLevel: 9 },
    { name: 'bronze_3', minLevel: 10, maxLevel: 14 },
    { name: 'silver_1', minLevel: 15, maxLevel: 19 },
    { name: 'silver_2', minLevel: 20, maxLevel: 24 },
    { name: 'silver_3', minLevel: 25, maxLevel: 29 },
    { name: 'gold_1', minLevel: 30, maxLevel: 39 },
    { name: 'gold_2', minLevel: 40, maxLevel: 49 },
    { name: 'gold_3', minLevel: 50, maxLevel: 100 },
  ],

  // XP thresholds for levels (level -> XP required)
  XP_THRESHOLDS: {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
    6: 1000,
    7: 1350,
    8: 1750,
    9: 2200,
    10: 2700,
    15: 5000,
    20: 8500,
    25: 12500,
    30: 17500,
    40: 30000,
    50: 50000,
  },

  // Roles
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },

  // Transaction types
  TRANSACTION_TYPES: {
    TAP: 'tap',
    TASK_CLAIM: 'task_claim',
    AD_VIEW: 'ad_view',
    REFERRAL_REWARD: 'referral_reward',
    ADMIN_ADJUSTMENT: 'admin_adjustment',
  },

  // Task types
  TASK_TYPES: {
    SOCIAL: 'social',
    GAMEPLAY: 'gameplay',
    REFERRAL: 'referral',
    SPECIAL: 'special',
  },

  // Referral status
  REFERRAL_STATUS: {
    PENDING: 'pending',
    QUALIFIED: 'qualified',
    REWARDED: 'rewarded',
  },

  // Ad providers
  AD_PROVIDERS: {
    NONE: 'none',
    ADMOB: 'admob',
    APPLOVIN: 'applovin',
    UNITY_ADS: 'unity_ads',
  },
};
