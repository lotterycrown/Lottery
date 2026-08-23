import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

const transport = (pino as any).transport
  ? (pino as any).transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false,
        translateTime: 'SYS:standard',
      },
    })
  : undefined;

export const logger = pino({
  level: logLevel,
  ...(transport ? { transport } : {}),
});

export const createRequestLogger = () => {
  return (req: { method: string; url: string }, res: unknown) => {
    logger.info(`${req.method} ${req.url}`);
  };
};
