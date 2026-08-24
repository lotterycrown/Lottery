import { pino } from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

// Pretty-print logs in development only; production uses plain JSON logs
export const logger = isProduction
  ? pino({ level: logLevel })
  : pino({
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
        },
      },
    });

export const createRequestLogger = () => {
  return (req: { method: string; url: string }): void => {
    logger.info(`${req.method} ${req.url}`);
  };
};
