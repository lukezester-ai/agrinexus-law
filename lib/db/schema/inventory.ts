import { pgTable, text, uuid, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { accountPlan } from './account_plan';

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sku: text('sku'),
  name: text('name').notNull(),
  unitOfMeasure: text('unit_of_measure').notNull().default('br'),
  category: text('category'),
  inventoryAccountId: uuid('inventory_account_id').references(() => accountPlan.id),
  costingMethod: text('costing_method').notNull().default('weighted_average'),
  minStock: numeric('min_stock', { precision: 15, scale: 3 }),
  currentStock: numeric('current_stock', { precision: 15, scale: 3 }).notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id'),
  type: text('type').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }),
  totalCost: numeric('total_cost', { precision: 15, scale: 2 }),
  movementDate: timestamp('movement_date').notNull().defaultNow(),
  referenceId: text('reference_id'),
  referenceType: text('reference_type'),
  description: text('description'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
