import { CacheManager } from './cache-manager';
import { generateCacheKey } from './utils';

interface CacheDecoratorOptions {
  ttl?: number;
  tags?: string[];
  key?: string | ((target: any, propertyKey: string, args: any[]) => string);
}

export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cacheManager = new CacheManager(globalRedis); // 假设有全局 Redis 实例

    descriptor.value = async function (...args: any[]) {
      const cacheKey = typeof options.key === 'function'
        ? options.key(target, propertyKey, args)
        : options.key || generateCacheKey(target.constructor.name, propertyKey, args);

      // 尝试从缓存获取
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 执行原始方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      await cacheManager.set(cacheKey, result, {
        ttl: options.ttl,
        tags: options.tags,
      });

      return result;
    };

    return descriptor;
  };
}