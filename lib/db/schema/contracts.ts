import { pgTable, text, uuid, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const contractTemplates = pgTable('contract_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('lease'),
  content: text('content').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => contractTemplates.id, { onDelete: 'set null' }),
  counterpartyId: uuid('counterparty_id'),
  contractNumber: text('contract_number').notNull(),
  type: text('type').notNull().default('lease'),
  status: text('status').notNull().default('draft'),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  expiryDate: timestamp('expiry_date'),
  content: text('content').notNull(),
  filledData: jsonb('filled_data'),
  documentId: text('document_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
