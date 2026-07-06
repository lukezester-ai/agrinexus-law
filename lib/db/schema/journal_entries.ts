import { pgTable, text, uuid, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';
import { accountPlan } from './account_plan';

export const journalHeaders = pgTable('journal_headers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  journalNumber: text('journal_number').notNull(),
  entryDate: timestamp('entry_date').notNull(),
  description: text('description'),
  documentType: text('document_type'),
  documentId: text('document_id'),
  status: text('status').notNull().default('draft'),
  postedBy: uuid('posted_by').references(() => users.id),
  postedAt: timestamp('posted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const journalLines = pgTable('journal_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id').notNull().references(() => journalHeaders.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accountPlan.id),
  entryType: text('entry_type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  analyticalCode: text('analytical_code'),
  description: text('description'),
  vatCode: text('vat_code'),
});
