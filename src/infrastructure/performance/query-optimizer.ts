import { db } from '../database';
import { logger } from '../logger';
import { metrics } from '../../monitoring/metrics';
import { QueryOptions } from '../../domain/interfaces/repository';

export class QueryOptimizer {
  async analyzeQuery(query: string): Promise<void> {
    const startTime = Date.now();
    try {
      const explain = await db.execute(`EXPLAIN ANALYZE ${query}`);
      
      // 记录查询计划
      logger.debug({ explain }, 'Query execution plan');
      
      // 更新性能指标
      const duration = Date.now() - startTime;
      metrics.httpRequestDurationSeconds.observe(
        { type: 'query_analysis' },
        duration / 1000
      );
    } catch (error) {
      logger.error({ error, query }, 'Query analysis failed');
    }
  }

  optimizeQueryOptions(options: QueryOptions): QueryOptions {
    // 限制最大页面大小
    if (options.limit && options.limit > 100) {
      options.limit = 100;
    }

    // 优化字段选择
    if (options.fields?.length) {
      // 确保总是包含主键
      if (!options.fields.includes('id')) {
        options.fields.push('id');
      }
    }

    // 优化排序
    if (options.sort) {
      // 确保排序字段有索引
      const indexedFields = ['id', 'created_at', 'updated_at'];
      if (!indexedFields.includes(options.sort.field)) {
        options.sort.field = 'created_at';
      }
    }

    return options;
  }
}