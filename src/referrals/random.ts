const getCrypto = (): Crypto => {
  if (!globalThis.crypto) {
    throw new Error('Secure random generator is not available');
  }
  return globalThis.crypto;
};

export const secureRandomInt = (maxExclusive: number): number => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }

  const cryptoApi = getCrypto();
  const upperBound = 0x100000000;
  const threshold = upperBound - (upperBound % maxExclusive);
  const buffer = new Uint32Array(1);

  let value = 0;
  do {
    cryptoApi.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= threshold);

  return value % maxExclusive;
};

export const secureId = (prefix: string, length = 8): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let output = '';
  for (let index = 0; index < length; index += 1) {
    output += alphabet[secureRandomInt(alphabet.length)];
  }

  return `${prefix}_${Date.now().toString(36)}_${output}`;
};
