import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
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
  return (req: any, res: any) => {
    logger.info(`${req.method} ${req.url}`);
  };
};
