import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { db } from '../infrastructure/database';
import { redis } from '../infrastructure/cache';
import { logger } from '../infrastructure/logger';

interface HealthCheck {
  status: 'ok' | 'error';
  details?: unknown;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    [key: string]: HealthCheck;
  };
}

export class HealthMonitor {
  constructor(
    private readonly db: typeof db,
    private readonly redis: Redis
  ) {}

  async checkHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ]);

    const [database, cache, disk, memory] = checks;

    const health: SystemHealth = {
      status: this.determineOverallStatus(checks),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      checks: {
        database,
        cache,
        disk,
        memory,
      },
    };

    return health;
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await db.execute(sql`SELECT 1`);
      return { status: 'ok' };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    try {
      const result = await redis.ping();
      return { status: result === 'PONG' ? 'ok' : 'error' };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    try {
      const { freemem, totalmem } = process;
      const usagePercent = (1 - freemem() / totalmem()) * 100;
      
      return {
        status: usagePercent < 90 ? 'ok' : 'error',
        details: {
          usagePercent: Math.round(usagePercent),
          free: this.formatBytes(freemem()),
          total: this.formatBytes(totalmem()),
        },
      };
    } catch (error) {
      logger.error('Disk space check failed:', error);
      return { status: 'error', details: error };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    try {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed / usage.heapTotal;
      
      return {
        status: heapUsed < 0.9 ? 'ok' : 'error',
        details: {
          heapUsed: this.formatBytes(usage.heapUsed),
          heapTotal: this.formatBytes(usage.heapTotal),
          external: this.formatBytes(usage.external),
          rss: this.formatBytes(usage.rss),
        },
      };
    } catch (error) {
      logger.error('Memory usage check failed:', error);
      return { status: 'error', details: error };
    }
  }

  private determineOverallStatus(checks: HealthCheck[]): SystemHealth['status'] {
    const errorCount = checks.filter(check => check.status === 'error').length;
    
    if (errorCount === 0) return 'healthy';
    if (errorCount === checks.length) return 'unhealthy';
    return 'degraded';
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)}${units[unitIndex]}`;
  }
}