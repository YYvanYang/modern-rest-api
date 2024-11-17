import { Redis } from 'ioredis';
import { logger } from '../logger';
import { metrics } from '../../monitoring/metrics';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

export class CacheManager {
  private readonly defaultTTL = 3600; // 1 hour

  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const data = await this.redis.get(key);
      
      // 更新缓存指标
      metrics.cacheHitRatio.inc(data ? 1 : 0);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    } finally {
      const duration = Date.now() - startTime;
      metrics.httpRequestDurationSeconds.observe({ type: 'cache_get' }, duration / 1000);
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const startTime = Date.now();
    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      const multi = this.redis.multi();
      
      // 设置主缓存
      multi.setex(key, ttl, serializedValue);

      // 如果有标签，更新标签索引
      if (options.tags?.length) {
        for (const tag of options.tags) {
          multi.sadd(`tag:${tag}`, key);
        }
      }

      await multi.exec();
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
    } finally {
      const duration = Date.now() - startTime;
      metrics.httpRequestDurationSeconds.observe({ type: 'cache_set' }, duration / 1000);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache invalidate error');
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const multi = this.redis.multi();
      
      // 获取所有标记的键
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length) {
          // 删除所有相关的缓存
          multi.del(...keys);
          // 清理标签集
          multi.del(`tag:${tag}`);
        }
      }

      await multi.exec();
    } catch (error) {
      logger.error({ error, tags }, 'Cache invalidate by tags error');
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache invalidate pattern error');
    }
  }
}