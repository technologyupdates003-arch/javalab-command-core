import pino from 'pino';
import { config } from '@/config/index.js';

const logger = pino({
  level: config.logging.level,
  transport:
    config.isDevelopment && process.stdout.isTTY
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
