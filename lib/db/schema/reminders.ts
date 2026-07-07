import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  isCompleted: text('is_completed').notNull().default('false'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
