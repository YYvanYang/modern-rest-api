import { z } from 'zod';
import 'dotenv/config';


const configSchema = z.object({
  app: z.object({
    name: z.string().default('modern-api'),
    env: z.enum(['development', 'test', 'production']).default('development'),
    port: z.number().default(3000),
    apiPrefix: z.string().default('/api/v1'),
  }),
  db: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(5432),
    username: z.string(),
    password: z.string(),
    database: z.string(),
    maxConnections: z.number().default(20),
    idleTimeout: z.number().default(30000),
  }),
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
  }),
  auth: z.object({
    jwtSecret: z.string(),
    jwtExpiresIn: z.string().default('1h'),
    refreshTokenExpiresIn: z.string().default('7d'),
  }),
  cors: z.object({
    origins: z.array(z.string()).default(['*']),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  }),
  rateLimit: z.object({
    windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
    max: z.number().default(100), // Limit each IP to 100 requests per windowMs
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    prettify: z.boolean().default(false),
  }),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsPath: z.string().default('/metrics'),
  }),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  try {
    return configSchema.parse({
      app: {
        name: process.env.APP_NAME,
        env: process.env.NODE_ENV,
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
        apiPrefix: process.env.API_PREFIX,
      },
      db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        maxConnections: process.env.DB_MAX_CONNECTIONS ? 
          parseInt(process.env.DB_MAX_CONNECTIONS, 10) : undefined,
        idleTimeout: process.env.DB_IDLE_TIMEOUT ?
          parseInt(process.env.DB_IDLE_TIMEOUT, 10) : undefined,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET!,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      },
      cors: {
        origins: process.env.CORS_ORIGINS?.split(','),
        methods: process.env.CORS_METHODS?.split(','),
      },
      rateLimit: {
        windowMs: process.env.RATE_LIMIT_WINDOW_MS ? 
          parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : undefined,
        max: process.env.RATE_LIMIT_MAX ? 
          parseInt(process.env.RATE_LIMIT_MAX, 10) : undefined,
      },
      logging: {
        level: process.env.LOG_LEVEL as any,
        prettify: process.env.LOG_PRETTIFY === 'true',
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        metricsPath: process.env.METRICS_PATH,
      },
    });
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}

export const config = loadConfig();