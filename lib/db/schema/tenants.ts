import { pgTable, text, uuid, timestamp, boolean, jsonb, numeric } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  bulstat: text('bulstat').unique(),
  vatNumber: text('vat_number'),
  address: text('address'),
  logoUrl: text('logo_url'),
  phone: text('phone'),
  email: text('email'),
  plan: text('plan').notNull().default('free'),
  trialEndsAt: timestamp('trial_ends_at'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'),
  isActive: boolean('is_active').notNull().default(true),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
