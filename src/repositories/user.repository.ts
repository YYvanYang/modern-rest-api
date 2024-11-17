import { User } from '../domain/entities/user.entity';
import { users } from '../db/schema';
import { Repository } from './base.repository';
import { NotFoundError } from '../errors/application-errors';
import { db } from '../infrastructure/database';

export class UserRepository extends Repository<User, string> {
  constructor() {
    super(db, users);
  }

  protected mapToEntity(record: typeof users.$inferSelect): User {
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      password: record.password,
      role: record.role,
      status: record.status,
      lastLoginAt: record.lastLoginAt || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0] ? this.mapToEntity(result[0]) : null;
  }

  async findActive(): Promise<User[]> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.status, 'active'));
    return results.map(this.mapToEntity);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
}