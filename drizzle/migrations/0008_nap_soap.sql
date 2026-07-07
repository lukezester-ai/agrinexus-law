-- Add НАП e-фактура fields to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nap_uuid text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nap_status text DEFAULT 'not_submitted';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nap_submitted_at timestamp;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nap_response jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS nap_error text;

-- Add НАП e-фактура fields to purchase_invoices
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS nap_uuid text;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS nap_status text DEFAULT 'not_submitted';
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS nap_submitted_at timestamp;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS nap_response jsonb;
ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS nap_error text;

-- Add НАП configuration to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nap_username text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nap_certificate text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nap_settings jsonb;
