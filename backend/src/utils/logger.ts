import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export const logger = pino(
  isTest
    ? { level: 'silent' }
    : {
        level: logLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: false,
            translateTime: 'SYS:standard',
          },
        },
      }
);

export const createRequestLogger = () => {
  return (req: any): void => {
    logger.info(`${req.method} ${req.url}`);
  };
};
