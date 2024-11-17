import { Pool } from 'pg';
import { logger } from '../logger';
import { metrics } from '../../monitoring/metrics';

export class ConnectionPoolManager {
  private readonly pool: Pool;

  constructor(config: any) {
    this.pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.initializePoolMonitoring();
  }

  private initializePoolMonitoring(): void {
    this.pool.on('connect', () => {
      metrics.dbConnectionPoolSize.inc();
      logger.debug('New database connection established');
    });

    this.pool.on('remove', () => {
      metrics.dbConnectionPoolSize.dec();
      logger.debug('Database connection removed from pool');
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      metrics.apiErrorsTotal.inc({ type: 'db_error' });
    });

    // 定期报告连接池状态
    setInterval(() => {
      const poolStatus = this.pool.totalCount;
      metrics.dbConnectionPoolSize.set(poolStatus);
      
      if (poolStatus >= this.pool.options.max * 0.8) {
        logger.warn(
          `Connection pool nearing capacity: ${poolStatus}/${this.pool.options.max}`
        );
      }
    }, 5000);
  }

  async getConnection() {
    const startTime = Date.now();
    try {
      const client = await this.pool.connect();
      const duration = Date.now() - startTime;
      
      metrics.httpRequestDurationSeconds.observe(
        { type: 'db_connection' },
        duration / 1000
      );

      return client;
    } catch (error) {
      logger.error('Failed to get database connection', error);
      throw error;
    }
  }
}