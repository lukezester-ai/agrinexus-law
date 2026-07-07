import { pgTable, text, uuid, timestamp, numeric, date } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const fixedAssets = pgTable('fixed_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  inventoryNumber: text('inventory_number').notNull(),
  name: text('name').notNull(),
  category: text('category'),
  acquisitionDate: date('acquisition_date').notNull(),
  acquisitionCost: numeric('acquisition_cost', { precision: 15, scale: 2 }).notNull(),
  salvageValue: numeric('salvage_value', { precision: 15, scale: 2 }).default('0'),
  usefulLifeMonths: numeric('useful_life_months').notNull(),
  amortizationMethod: text('amortization_method').default('straight_line'),
  accumulatedAmortization: numeric('accumulated_amortization', { precision: 15, scale: 2 }).default('0'),
  bookValue: numeric('book_value', { precision: 15, scale: 2 }),
  location: text('location'),
  notes: text('notes'),
  isActive: text('is_active').default('true'),
  writtenOffAt: timestamp('written_off_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
