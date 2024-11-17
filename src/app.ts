import express, { Express, Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import cors from 'cors';
import { Container } from './container';
import { config } from './config';
import { logger } from './infrastructure/logger';
import { db } from './infrastructure/database';
import { redis } from './infrastructure/cache';
import { 
  errorHandler, 
  requestId, 
  requestContext, 
  requestLogger 
} from './middleware';
import { 
  performanceMonitor, 
  compressionMiddleware, 
  requestThrottling, 
  responseCompression 
} from './middleware/performance';
import { securityMiddleware } from './middleware/security';
import { metricsMiddleware } from './middleware/metrics';
import { router } from './routes';
import { HealthMonitor } from './monitoring/health';
import { metrics } from './monitoring/metrics';

export class App {
  public express: Express;
  private healthMonitor: HealthMonitor;

  constructor() {
    this.express = express();
    this.healthMonitor = new HealthMonitor(db, redis);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 基础中间件
    this.express.use(express.json({ limit: '10mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 请求ID和上下文
    this.express.use(requestId);
    this.express.use(requestContext);

    // 日志
    this.express.use(pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.id,
      }),
    }));
    this.express.use(requestLogger);

    // 安全
    this.express.use(helmet());
    this.express.use(cors(config.cors));
    this.express.use(securityMiddleware.helmet);
    this.express.use(securityMiddleware.rateLimit);

    // 性能优化
    this.express.use(compressionMiddleware);
    this.express.use(performanceMonitor);
    this.express.use(requestThrottling({
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.max,
    }));
    this.express.use(responseCompression);

    // 指标收集
    this.express.use(metricsMiddleware());

    // Trust proxy
    this.express.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API路由
    this.express.use(config.app.apiPrefix, router);

    // 健康检查路由
    this.express.get('/health', async (req: Request, res: Response) => {
      const health = await this.healthMonitor.checkHealth();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // 存活探针
    this.express.get('/liveness', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 就绪探针
    this.express.get('/readiness', async (req: Request, res: Response) => {
      try {
        await Promise.all([
          db.execute(sql`SELECT 1`),
          redis.ping()
        ]);
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      } catch (error) {
        res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
      }
    });

    // 指标端点
    if (config.monitoring.enabled) {
      this.express.get(config.monitoring.metricsPath, async (req: Request, res: Response) => {
        res.set('Content-Type', register.contentType);
        res.send(await register.metrics());
      });
    }

    // 404处理
    this.express.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.express.use(errorHandler);

    // 处理未捕获的Promise rejection
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('Unhandled Promise rejection', reason);
      metrics.apiErrorsTotal.inc({ type: 'unhandled_rejection' });
    });

    // 处理未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error);
      metrics.apiErrorsTotal.inc({ type: 'uncaught_exception' });
      
      // 给应用一些时间来处理当前的请求
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  public async start(): Promise<void> {
    try {
      // 启动服务器
      const server = this.express.listen(config.app.port, () => {
        logger.info(
          `🚀 Server started on port ${config.app.port} in ${config.app.env} mode`
        );
      });

      // 优雅关闭处理
      const gracefulShutdown = async (signal: string) => {
        logger.info(`Received ${signal}, starting graceful shutdown`);

        server.close(async () => {
          try {
            // 关闭数据库连接
            await db.end();
            // 关闭Redis连接
            await redis.quit();
            
            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });

        // 如果10秒内没有完成关闭，强制退出
        setTimeout(() => {
          logger.error('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      };

      // 注册关闭信号处理
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const app = new App();
  app.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default App;