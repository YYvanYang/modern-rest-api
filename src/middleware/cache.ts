import { Request, Response, NextFunction } from 'express';
import { CacheManager } from '../infrastructure/cache/cache-manager';

interface CacheMiddlewareOptions {
  ttl?: number;
  tags?: string[];
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const cacheManager = new CacheManager(globalRedis);

  return async (req: Request, res: Response, next: NextFunction) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    // 检查条件
    if (options.condition && !options.condition(req)) {
      return next();
    }

    const cacheKey = `http:${req.originalUrl}`;

    try {
      // 尝试从缓存获取
      const cached = await cacheManager.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // 保存原始的 json 方法
      const originalJson = res.json;
      
      // 重写 json 方法以拦截响应
      res.json = function (body: any) {
        // 恢复原始方法
        res.json = originalJson;

        // 缓存响应
        void cacheManager.set(cacheKey, body, {
          ttl: options.ttl,
          tags: options.tags,
        });

        // 发送响应
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}