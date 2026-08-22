export const MICRO_UNITS_PER_COIN = 1_000_000;

export type CrownTier =
  | 'bronze_1'
  | 'bronze_2'
  | 'bronze_3'
  | 'silver_1'
  | 'silver_2'
  | 'silver_3'
  | 'gold_1'
  | 'gold_2'
  | 'gold_3';

export const CROWN_TIERS: Array<{ minLevel: number; tier: CrownTier }> = [
  { minLevel: 1, tier: 'bronze_1' },
  { minLevel: 3, tier: 'bronze_2' },
  { minLevel: 5, tier: 'bronze_3' },
  { minLevel: 7, tier: 'silver_1' },
  { minLevel: 10, tier: 'silver_2' },
  { minLevel: 13, tier: 'silver_3' },
  { minLevel: 16, tier: 'gold_1' },
  { minLevel: 20, tier: 'gold_2' },
  { minLevel: 24, tier: 'gold_3' },
];

export const levelFromXp = (xp: number): number => Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

export const crownTierFromLevel = (level: number): CrownTier => {
  let tier: CrownTier = 'bronze_1';
  for (const item of CROWN_TIERS) {
    if (level >= item.minLevel) {
      tier = item.tier;
    }
  }
  return tier;
};

export const coinsMicroToCoins = (coinsMicro: number): number => coinsMicro / MICRO_UNITS_PER_COIN;

export const coinsToMicro = (coins: number): number => Math.round(coins * MICRO_UNITS_PER_COIN);
