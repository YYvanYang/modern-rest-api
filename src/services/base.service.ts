import { BaseRepository, QueryOptions } from '../domain/interfaces/repository';
import { NotFoundError } from '../errors/application-errors';
import { eventEmitter } from '../events/event-emitter';
import { AuditRepository } from '../repositories/audit.repository';
import { CacheService } from '../infrastructure/cache/cache.service';

export abstract class BaseService<T, K> {
  constructor(
    protected readonly repository: BaseRepository<T, K>,
    protected readonly cacheService: CacheService,
    protected readonly auditRepository: AuditRepository,
    protected readonly entityName: string
  ) {}

  async findById(id: K): Promise<T> {
    const cacheKey = `${this.entityName}:${id}`;
    
    // Try cache first
    const cached = await this.cacheService.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError(this.entityName);
    }

    // Cache the result
    await this.cacheService.set(cacheKey, entity);
    
    return entity;
  }

  async findAll(options?: QueryOptions): Promise<{ items: T[]; total: number }> {
    const cacheKey = `${this.entityName}:list:${JSON.stringify(options)}`;
    
    // Try cache first
    const cached = await this.cacheService.get<{ items: T[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const [items, total] = await Promise.all([
      this.repository.findAll(options),
      this.repository.count(options?.filter),
    ]);

    const result = { items, total };
    
    // Cache the result
    await this.cacheService.set(cacheKey, result);
    
    return result;
  }

  async create(data: Partial<T>, userId: string): Promise<T> {
    const entity = await this.repository.create(data);

    // Audit log
    await this.auditRepository.logChange(
      userId,
      'CREATE',
      this.entityName,
      (entity as any).id,
      null,
      entity
    );

    // Clear relevant caches
    await this.clearListCache();

    // Emit event
    await eventEmitter.emit(`${this.entityName}.created`, entity);

    return entity;
  }

  async update(id: K, data: Partial<T>, userId: string): Promise<T> {
    const oldEntity = await this.repository.findById(id);
    if (!oldEntity) {
      throw new NotFoundError(this.entityName);
    }

    const updatedEntity = await this.repository.update(id, data);

    // Audit log
    await this.auditRepository.logChange(
      userId,
      'UPDATE',
      this.entityName,
      id as string,
      oldEntity,
      updatedEntity
    );

    // Clear caches
    await Promise.all([
      this.clearEntityCache(id),
      this.clearListCache(),
    ]);

    // Emit event
    await eventEmitter.emit(`${this.entityName}.updated`, {
      old: oldEntity,
      new: updatedEntity,
    });

    return updatedEntity;
  }

  async delete(id: K, userId: string): Promise<void> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError(this.entityName);
    }

    await this.repository.delete(id);

    // Audit log
    await this.auditRepository.logChange(
      userId,
      'DELETE',
      this.entityName,
      id as string,
      entity,
      null
    );

    // Clear caches
    await Promise.all([
      this.clearEntityCache(id),
      this.clearListCache(),
    ]);

    // Emit event
    await eventEmitter.emit(`${this.entityName}.deleted`, entity);
  }

  protected async clearEntityCache(id: K): Promise<void> {
    await this.cacheService.delete(`${this.entityName}:${id}`);
  }

  protected async clearListCache(): Promise<void> {
    const pattern = `${this.entityName}:list:*`;
    await this.cacheService.deletePattern(pattern);
  }
}