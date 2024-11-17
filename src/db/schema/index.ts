import { pgTable, uuid, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { UserRole, UserStatus } from '../../domain/entities/user.entity';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  password: text('password').notNull(),
  role: varchar('role', { length: 20 }).$type<UserRole>().notNull().default(UserRole.USER),
  status: varchar('status', { length: 20 }).$type<UserStatus>().notNull().default(UserStatus.ACTIVE),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 50 }).notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  username: (schema) => schema.username.min(3).max(50),
  password: (schema) => schema.password.min(8).max(100),
  role: (schema) => schema.role.optional(),
});

export const updateUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email().optional(),
  username: (schema) => schema.username.min(3).max(50).optional(),
  password: (schema) => schema.password.min(8).max(100).optional(),
  role: (schema) => schema.role.optional(),
  status: (schema) => schema.status.optional(),
}).pick({ email: true, username: true, status: true });