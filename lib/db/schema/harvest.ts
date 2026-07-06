import { pgTable, text, uuid, timestamp, numeric } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { fields } from './fields';
import { crops } from './fields';
import { inventoryItems } from './inventory';

export const harvestRecords = pgTable('harvest_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').references(() => fields.id, { onDelete: 'set null' }),
  cropId: uuid('crop_id').references(() => crops.id, { onDelete: 'set null' }),
  date: timestamp('date').notNull().defaultNow(),
  areaDecares: numeric('area_decares', { precision: 12, scale: 2 }).notNull(),
  yieldAmount: numeric('yield_amount', { precision: 12, scale: 2 }).notNull(),
  yieldUnit: text('yield_unit').notNull().default('kg'),
  moisture: numeric('moisture', { precision: 5, scale: 1 }),
  quality: text('quality'),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
