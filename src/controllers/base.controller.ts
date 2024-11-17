import { Request, Response, NextFunction } from 'express';
import { BaseService } from '../services/base.service';
import { QueryOptions } from '../domain/interfaces/repository';
import { logger } from '../infrastructure/logger';

export abstract class BaseController<T, K> {
  constructor(protected readonly service: BaseService<T, K>) {}

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options: QueryOptions = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sort: req.query.sort ? {
          field: (req.query.sort as string).split(':')[0],
          order: (req.query.sort as string).split(':')[1] as 'asc' | 'desc'
        } : undefined,
        filter: req.query.filter ? JSON.parse(req.query.filter as string) : undefined,
        fields: req.query.fields ? (req.query.fields as string).split(',') : undefined,
      };

      const result = await this.service.findAll(options);
      
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
      const totalPages = Math.ceil(result.total / (options.limit || 10));

      res.json({
        data: result.items,
        meta: {
          total: result.total,
          page: options.page,
          limit: options.limit,
          totalPages,
        },
        links: this.generatePaginationLinks(baseUrl, options.page!, totalPages, options.limit!),
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as any;
      const entity = await this.service.findById(id);
      res.json({
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const entity = await this.service.create(req.body, userId);
      res.status(201).json({
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as any;
      const userId = req.user!.id;
      const entity = await this.service.update(id, req.body, userId);
      res.json({
        data: entity,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as any;
      const userId = req.user!.id;
      await this.service.delete(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  private generatePaginationLinks(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    limit: number
  ): Record<string, string | null> {
    return {
      self: `${baseUrl}?page=${currentPage}&limit=${limit}`,
      first: currentPage === 1 ? null : `${baseUrl}?page=1&limit=${limit}`,
      prev: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}&limit=${limit}` : null,
      next: currentPage < totalPages ? `${baseUrl}?page=${currentPage + 1}&limit=${limit}` : null,
      last: currentPage === totalPages ? null : `${baseUrl}?page=${totalPages}&limit=${limit}`,
    };
  }
}