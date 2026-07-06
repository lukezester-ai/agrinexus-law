import { pgTable, text, uuid, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const machines = pgTable('machines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  make: text('make'),
  model: text('model'),
  year: numeric('year', { precision: 4, scale: 0 }),
  plateNumber: text('plate_number'),
  engineHours: numeric('engine_hours', { precision: 10, scale: 1 }).default('0'),
  fuelType: text('fuel_type'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const machineServices = pgTable('machine_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  machineId: uuid('machine_id').notNull().references(() => machines.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  type: text('type').notNull(),
  description: text('description'),
  cost: numeric('cost', { precision: 12, scale: 2 }).default('0'),
  hoursAtService: numeric('hours_at_service', { precision: 10, scale: 1 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
