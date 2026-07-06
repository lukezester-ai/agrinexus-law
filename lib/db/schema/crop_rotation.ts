import { pgTable, text, uuid, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { fields } from './fields';

export const cropRotationPlans = pgTable('crop_rotation_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  plannedCrop: text('planned_crop').notNull(),
  cropVariety: text('crop_variety'),
  previousCrop: text('previous_crop'),
  status: text('status').notNull().default('planned'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
