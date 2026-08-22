const MICRO_UNITS_PER_COIN = 1_000_000n;
const BASIS_POINTS_MULTIPLIER = 10_000n;

export const toMicroUnits = (decimal: string): bigint => {
  const normalized = decimal.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(normalized)) {
    throw new Error('Invalid decimal amount');
  }

  const [wholePart, fractionalPart = ''] = normalized.split('.');
  const paddedFraction = `${fractionalPart}000000`.slice(0, 6);

  return BigInt(wholePart) * MICRO_UNITS_PER_COIN + BigInt(paddedFraction);
};

export const fromMicroUnits = (micro: bigint): string => {
  const sign = micro < 0 ? '-' : '';
  const absolute = micro < 0 ? -micro : micro;
  const wholePart = absolute / MICRO_UNITS_PER_COIN;
  const fractionalPart = (absolute % MICRO_UNITS_PER_COIN)
    .toString()
    .padStart(6, '0')
    .replace(/0+$/, '');

  return `${sign}${wholePart.toString()}${fractionalPart ? `.${fractionalPart}` : ''}`;
};

export const addMicroUnits = (a: bigint, b: bigint): bigint => a + b;

export const percentageOfAmount = (amount: bigint, basisPoints: number): bigint => {
  if (!Number.isInteger(basisPoints) || basisPoints < 0) {
    throw new Error('Invalid basis points');
  }

  return (amount * BigInt(basisPoints)) / BASIS_POINTS_MULTIPLIER;
};

export const basisPointsToPercentage = (bp: number): string => {
  if (!Number.isInteger(bp) || bp < 0) {
    throw new Error('Invalid basis points');
  }

  const percentage = bp / 100;
  return Number.isInteger(percentage) ? percentage.toString() : percentage.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

export const percentageToBasisPoints = (pct: string): number => {
  const normalized = pct.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('Invalid percentage');
  }

  const [wholePart, fractionalPart = ''] = normalized.split('.');
  return Number(wholePart) * 100 + Number(`${fractionalPart}00`.slice(0, 2));
};
