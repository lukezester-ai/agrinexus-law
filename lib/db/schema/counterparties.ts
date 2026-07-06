import { pgTable, text, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const counterparties = pgTable('counterparties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('client'),
  name: text('name').notNull(),
  eik: text('eik'),
  vatNumber: text('vat_number'),
  address: text('address'),
  city: text('city'),
  email: text('email'),
  phone: text('phone'),
  contactPerson: text('contact_person'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
