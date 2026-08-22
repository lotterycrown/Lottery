export const MICRO_UNITS_PER_COIN = 1_000_000;

export const toMicroUnits = (coins: number): number => {
  if (!Number.isFinite(coins)) {
    return 0;
  }
  return Math.round(coins * MICRO_UNITS_PER_COIN);
};

export const fromMicroUnits = (microUnits: number): number => {
  if (!Number.isFinite(microUnits)) {
    return 0;
  }
  return microUnits / MICRO_UNITS_PER_COIN;
};

export const addMoney = (...amountsInMicroUnits: number[]): number =>
  amountsInMicroUnits.reduce((sum, amount) => sum + amount, 0);

export const calculatePercentageReward = (
  baseAmount: number,
  percentage: number
): number => {
  const baseMicro = toMicroUnits(baseAmount);
  const percentageBasisPoints = Math.round(percentage * 100);
  const rewardMicro = Math.floor((baseMicro * percentageBasisPoints) / 10_000);
  return fromMicroUnits(rewardMicro);
};
