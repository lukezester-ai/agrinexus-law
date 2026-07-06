import { pgTable, text, uuid, timestamp, numeric, jsonb, boolean, geometry } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  location: text('location'),
  areaDecares: numeric('area_decares', { precision: 12, scale: 2 }).notNull(),
  cadastralId: text('cadastral_id'),
  physicalBlockId: text('physical_block_id'),
  crop: text('crop'),
  cropVariety: text('crop_variety'),
  soilType: text('soil_type'),
  ownershipType: text('ownership_type').notNull().default('own'),
  ownerName: text('owner_name'),
  leaseEndDate: timestamp('lease_end_date'),
  geometry: jsonb('geometry'),
  centroid: jsonb('centroid'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const crops = pgTable('crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  variety: text('variety'),
  category: text('category').notNull(),
  expectedYield: numeric('expected_yield', { precision: 12, scale: 2 }),
  yieldUnit: text('yield_unit').notNull().default('kg/da'),
  typicalGrowingDays: numeric('typical_growing_days'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
