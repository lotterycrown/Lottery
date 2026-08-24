/**
 * JSON-safe serialization: converts BigInt values to strings so
 * database records can be returned through res.json() without
 * throwing "Do not know how to serialize a BigInt".
 */
export const serializeBigInt = <T>(value: T): T => {
  return JSON.parse(
    JSON.stringify(value, (_key, v: unknown) => (typeof v === 'bigint' ? v.toString() : v))
  ) as T;
};
