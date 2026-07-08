import { pgTable, text, uuid, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const insurancePolicies = pgTable('insurance_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  policyNumber: text('policy_number').notNull(),
  type: text('type').notNull().default('crop'),
  insurerName: text('insurer_name').notNull(),
  brokerName: text('broker_name'),
  insuredEntityType: text('insured_entity_type'),
  insuredEntityId: text('insured_entity_id'),
  insuredItemName: text('insured_item_name'),
  coverageDetails: jsonb('coverage_details'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  premiumAmount: numeric('premium_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  coverageAmount: numeric('coverage_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  deductible: numeric('deductible', { precision: 15, scale: 2 }).default('0'),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const insuranceClaims = pgTable('insurance_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  policyId: uuid('policy_id').notNull().references(() => insurancePolicies.id, { onDelete: 'cascade' }),
  claimNumber: text('claim_number').notNull(),
  claimDate: timestamp('claim_date').notNull().defaultNow(),
  description: text('description').notNull(),
  amountClaimed: numeric('amount_claimed', { precision: 15, scale: 2 }).notNull().default('0'),
  amountSettled: numeric('amount_settled', { precision: 15, scale: 2 }).default('0'),
  status: text('status').notNull().default('filed'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
