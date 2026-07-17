import { pgTable, text, uuid, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { fields } from './fields';
import { inventoryItems } from './inventory';

export const chemicalProducts = pgTable('chemical_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  productType: text('product_type').notNull(),
  activeSubstance: text('active_substance'),
  concentration: text('concentration'),
  unitOfMeasure: text('unit_of_measure').notNull().default('l'),
  withdrawalPeriodDays: numeric('withdrawal_period_days'),
  manufacturer: text('manufacturer'),
  permitNumber: text('permit_number'),
  hazardClass: text('hazard_class'),
  safetyIntervalDays: numeric('safety_interval_days'),
  isActive: text('is_active').notNull().default('true'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chemicalApplications = pgTable('chemical_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  applicationDate: timestamp('application_date').notNull(),
  productId: uuid('product_id').notNull().references(() => chemicalProducts.id),
  doseAmount: numeric('dose_amount', { precision: 12, scale: 3 }).notNull(),
  doseUnit: text('dose_unit').notNull().default('l/da'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 3 }).notNull(),
  totalUnit: text('total_unit').notNull().default('l'),
  crop: text('crop'),
  pestTarget: text('pest_target'),
  applicationMethod: text('application_method'),
  operatorName: text('operator_name'),
  weatherConditions: jsonb('weather_conditions'),
  notes: text('notes'),
  isCompleted: text('is_completed').notNull().default('true'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
