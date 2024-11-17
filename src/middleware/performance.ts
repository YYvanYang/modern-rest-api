import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../infrastructure/logger';
import { metrics } from '../monitoring/metrics';

// 压缩中间件配置
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});

// 性能监控中间件
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime();
  const startMemory = process.memoryUsage();

  // 响应完成后记录性能指标
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    const memoryDiff = process.memoryUsage().heapUsed - startMemory.heapUsed;

    // 记录请求处理时间
    metrics.httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route: req.route?.path || 'unknown',
        status_code: res.statusCode.toString(),
      },
      duration / 1000
    );

    // 记录内存使用
    logger.debug({
      duration,
      memoryUsed: memoryDiff,
      path: req.path,
      method: req.method,
    }, 'Request performance metrics');

    // 如果处理时间过长，记录警告
    if (duration > 1000) {
      logger.warn({
        duration,
        path: req.path,
        method: req.method,
        query: req.query,
      }, 'Slow request detected');
    }
  });

  next();
}

// 请求限流中间件
export function requestThrottling(options: {
  windowMs?: number;
  maxRequests?: number;
  delayAfter?: number;
  delayMs?: number;
}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    delayAfter = 50,
    delayMs = 500,
  } = options;

  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip;
    const now = Date.now();

    // 清理过期的请求记录
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key)!;
    const validRequests = userRequests.filter(time => time > now - windowMs);
    requests.set(key, validRequests);

    // 检查是否超过限制
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    }

    // 添加新请求
    validRequests.push(now);

    // 如果请求数超过延迟阈值，添加延迟
    if (validRequests.length > delayAfter) {
      const delay = delayMs * (validRequests.length - delayAfter);
      setTimeout(next, Math.min(delay, 10000));
    } else {
      next();
    }
  };
}

// 响应压缩中间件
export function responseCompression(req: Request, res: Response, next: NextFunction) {
  // 检查是否支持压缩
  const acceptEncoding = req.headers['accept-encoding'];
  
  if (acceptEncoding?.includes('br')) {
    res.setHeader('Content-Encoding', 'br');
  } else if (acceptEncoding?.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }

  next();
}