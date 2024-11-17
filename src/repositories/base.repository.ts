import { eq, and, or, sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { BaseRepository, QueryOptions, FilterOptions } from '../domain/interfaces/repository';

export abstract class Repository<T, K> implements BaseRepository<T, K> {
  constructor(
    protected readonly db: PostgresJsDatabase,
    protected readonly table: any
  ) {}

  protected abstract mapToEntity(record: any): T;

  async findById(id: K): Promise<T | null> {
    const result = await this.db.select().from(this.table).where(eq(this.table.id, id));
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const { page = 1, limit = 10, sort, filter, fields } = options;
    const offset = (page - 1) * limit;

    let query = this.db.select().from(this.table);

    // Apply filters
    if (filter) {
      const conditions = Object.entries(filter).map(([key, value]) => {
        if (Array.isArray(value)) {
          return or(...value.map(v => eq(this.table[key], v)));
        }
        return eq(this.table[key], value);
      });
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sort) {
      const { field, order } = sort;
      query = query.orderBy(order === 'desc' ? sql`${this.table[field]} DESC` : this.table[field]);
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const results = await query;
    return results.map(this.mapToEntity);
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const result = await this.db.insert(this.table).values(data).returning();
    return this.mapToEntity(result[0]);
  }

  async update(id: K, data: Partial<T>): Promise<T> {
    const result = await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    return this.mapToEntity(result[0]);
  }

  async delete(id: K): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    return result.length > 0;
  }

  async count(filter?: FilterOptions): Promise<number> {
    let query = this.db.select({ count: sql<number>`count(*)` }).from(this.table);

    if (filter) {
      const conditions = Object.entries(filter).map(([key, value]) => {
        if (Array.isArray(value)) {
          return or(...value.map(v => eq(this.table[key], v)));
        }
        return eq(this.table[key], value);
      });
      query = query.where(and(...conditions));
    }

    const result = await query;
    return Number(result[0].count);
  }
}