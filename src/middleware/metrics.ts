import { Request, Response, NextFunction } from 'express';
import { metrics } from '../monitoring/metrics';

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds + nanoseconds / 1e9;

      const route = req.route?.path || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode.toString();

      // 记录请求持续时间
      metrics.httpRequestDurationSeconds.observe(
        { method, route, status_code: statusCode },
        duration
      );

      // 增加请求计数
      metrics.httpRequestsTotal.inc({
        method,
        route,
        status_code: statusCode,
      });

      // 如果是错误响应，增加错误计数
      if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
        metrics.apiErrorsTotal.inc({
          type: statusCode.startsWith('4') ? 'client' : 'server',
          route,
        });
      }
    });

    next();
  };
}
