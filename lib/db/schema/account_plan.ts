import { pgTable, text, uuid, boolean, numeric, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const accountPlan = pgTable('account_plan', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accountNumber: text('account_number').notNull(),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  type: text('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isAnalytical: boolean('is_analytical').notNull().default(false),
  standard: text('standard').notNull().default('NSS'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AccountPlan = typeof accountPlan.$inferSelect;
export type NewAccountPlan = typeof accountPlan.$inferInsert;
