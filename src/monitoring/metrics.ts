import promClient from 'prom-client';
import { Request, Response } from 'express';

// 初始化默认注册表
export const register = new promClient.Registry();

// 设置默认标签
register.setDefaultLabels({
  app: 'modern-rest-api',
});

// 定义指标
export const metrics = {
  // HTTP 请求指标
  httpRequestDurationSeconds: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),

  // 请求总数计数器
  httpRequestsTotal: new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  }),

  // API 错误计数器
  apiErrorsTotal: new promClient.Counter({
    name: 'api_errors_total',
    help: 'Total number of API errors',
    labelNames: ['type', 'route'],
  }),

  // 活跃用户计数器
  activeUsers: new promClient.Gauge({
    name: 'active_users',
    help: 'Number of active users',
  }),

  // 数据库连接池指标
  dbConnectionPoolSize: new promClient.Gauge({
    name: 'db_connection_pool_size',
    help: 'Database connection pool size',
  }),

  // 缓存命中率
  cacheHitRatio: new promClient.Gauge({
    name: 'cache_hit_ratio',
    help: 'Cache hit ratio',
  }),

  // 认证指标
  authMetrics: {
    loginAttempts: new promClient.Counter({
      name: 'auth_login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status'],
    }),
    tokenRefreshes: new promClient.Counter({
      name: 'auth_token_refreshes_total',
      help: 'Total number of token refreshes',
    }),
  },
};

// 注册所有指标
Object.values(metrics).forEach((metric) => {
  if (metric instanceof promClient.Metric) {
    register.registerMetric(metric);
  } else if (typeof metric === 'object') {
    Object.values(metric).forEach((m) => register.registerMetric(m));
  }
});