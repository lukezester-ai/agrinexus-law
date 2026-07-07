import { pgTable, text, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  institutionName: text('institution_name'),
  iban: text('iban'),
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0'),
  currency: text('currency').default('BGN'),
  isActive: text('is_active').default('true'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('BGN'),
  date: timestamp('date').notNull(),
  description: text('description'),
  counterpartyName: text('counterparty_name'),
  counterpartyIban: text('counterparty_iban'),
  isReconciled: text('is_reconciled').default('false'),
  matchStatus: text('match_status').default('unmatched'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
