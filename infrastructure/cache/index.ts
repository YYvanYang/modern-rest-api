import { Redis } from 'ioredis';
import { config } from '../../config';
import { logger } from '../logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('connect', () => {
  logger.debug('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error', err);
});

export { redis };