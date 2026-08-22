import { describe, expect, it } from 'vitest';
import { coinsMicroToCoins, crownTierFromLevel, levelFromXp } from '../../shared/game/progression';

describe('progression', () => {
  it('maps xp to level deterministically', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(400)).toBe(3);
  });

  it('maps levels to crown tiers', () => {
    expect(crownTierFromLevel(1)).toBe('bronze_1');
    expect(crownTierFromLevel(10)).toBe('silver_2');
    expect(crownTierFromLevel(25)).toBe('gold_3');
  });

  it('converts micro-units to coin display value', () => {
    expect(coinsMicroToCoins(1_234_000)).toBe(1.234);
  });
});
