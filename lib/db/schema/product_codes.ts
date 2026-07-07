import { pgTable, text, uuid, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { inventoryItems } from './inventory';

export const productCodes = pgTable('product_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  codeType: text('code_type').notNull().default('ean'),
  isPrimary: text('is_primary').default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantCodeIdx: uniqueIndex('product_codes_tenant_code_idx').on(table.tenantId, table.code),
}));
