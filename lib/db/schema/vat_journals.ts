import { pgTable, text, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const vatJournals = pgTable('vat_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  periodYear: numeric('period_year', { precision: 4, scale: 0 }).notNull(),
  periodMonth: numeric('period_month', { precision: 2, scale: 0 }).notNull(),
  entryDate: timestamp('entry_date').notNull(),
  documentNumber: text('document_number'),
  counterpartyName: text('counterparty_name'),
  counterpartyVat: text('counterparty_vat'),
  invoiceNumber: text('invoice_number'),
  invoiceDate: timestamp('invoice_date'),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 15, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).notNull(),
  isIntraCommunity: text('is_intra_community').notNull().default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
