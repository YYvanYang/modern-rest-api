declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      APP_NAME: string;
      API_PREFIX: string;
      
      // Database
      DB_HOST: string;
      DB_PORT: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_DATABASE: string;
      DB_MAX_CONNECTIONS: string;
      DB_IDLE_TIMEOUT: string;
      
      // Redis
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD?: string;
      REDIS_DB: string;
      
      // Auth
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      REFRESH_TOKEN_EXPIRES_IN: string;
      
      // CORS
      CORS_ORIGINS: string;
      CORS_METHODS: string;
      
      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX: string;
      
      // Logging
      LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
      LOG_PRETTIFY: string;
      
      // Monitoring
      MONITORING_ENABLED: string;
      METRICS_PATH: string;
      
      [key: string]: string | undefined;
    }
  }
}

export {};