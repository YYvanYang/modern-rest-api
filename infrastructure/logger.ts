import pino from 'pino';
import { config } from '../config';

const logger = pino({
  level: config.logging.level,
  transport: config.logging.prettify
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: config.app.env,
    version: process.env.npm_package_version,
  },
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]',
  },
});

export { logger };