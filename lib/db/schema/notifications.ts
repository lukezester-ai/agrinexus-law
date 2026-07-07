import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message'),
  link: text('link'),
  isRead: text('is_read').default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
