import { pgTable, text, uuid, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  docType: text('doc_type').notNull().default('other'),
  category: text('category'),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  fileSize: numeric('file_size'),
  linkedModule: text('linked_module'),
  linkedEntityId: text('linked_entity_id'),
  description: text('description'),
  tags: text('tags'),
  isPinned: boolean('is_pinned').notNull().default(false),
  uploadedBy: uuid('uploaded_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
