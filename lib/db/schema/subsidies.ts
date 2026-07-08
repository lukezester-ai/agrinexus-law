import { pgTable, text, uuid, timestamp, numeric, jsonb, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const subsidySchemes = pgTable('subsidy_schemes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('area'),
  description: text('description'),
  ratePerDecare: numeric('rate_per_decare', { precision: 12, scale: 2 }),
  maxArea: numeric('max_area', { precision: 12, scale: 2 }),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  season: text('season').notNull(),
  status: text('status').notNull().default('active'),
  eligibilityRules: jsonb('eligibility_rules'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const subsidyApplications = pgTable('subsidy_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  schemeId: uuid('scheme_id').notNull().references(() => subsidySchemes.id, { onDelete: 'cascade' }),
  season: text('season').notNull(),
  applicationNumber: text('application_number'),
  status: text('status').notNull().default('draft'),
  totalArea: numeric('total_area', { precision: 12, scale: 2 }),
  amountExpected: numeric('amount_expected', { precision: 15, scale: 2 }),
  amountReceived: numeric('amount_received', { precision: 15, scale: 2 }).default('0'),
  submissionDate: timestamp('submission_date'),
  approvalDate: timestamp('approval_date'),
  paymentDate: timestamp('payment_date'),
  fields: jsonb('fields'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
