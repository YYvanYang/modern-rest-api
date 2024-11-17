import { AuditLog } from '../domain/entities/audit.entity';
import { auditLogs } from '../db/schema';
import { Repository } from './base.repository';
import { db } from '../infrastructure/database';

export class AuditRepository extends Repository<AuditLog, string> {
  constructor() {
    super(db, auditLogs);
  }

  protected mapToEntity(record: typeof auditLogs.$inferSelect): AuditLog {
    return {
      id: record.id,
      userId: record.userId,
      action: record.action,
      resource: record.resource,
      resourceId: record.resourceId,
      oldValue: record.oldValue,
      newValue: record.newValue,
      metadata: record.metadata,
      createdAt: record.createdAt,
    };
  }

  async logChange(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    oldValue?: unknown,
    newValue?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.create({
      userId,
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      metadata,
    });
  }
}