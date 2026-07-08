-- ДФЗ/Субсидии — subsidy schemes and applications
CREATE TABLE IF NOT EXISTS subsidy_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'area',
  description text,
  rate_per_decare numeric(12,2),
  max_area numeric(12,2),
  budget numeric(15,2),
  season text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  eligibility_rules jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subsidy_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  scheme_id uuid NOT NULL REFERENCES subsidy_schemes(id) ON DELETE CASCADE,
  season text NOT NULL,
  application_number text,
  status text NOT NULL DEFAULT 'draft',
  total_area numeric(12,2),
  amount_expected numeric(15,2),
  amount_received numeric(15,2) DEFAULT '0',
  submission_date timestamp,
  approval_date timestamp,
  payment_date timestamp,
  fields jsonb,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE subsidy_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_applications ENABLE ROW LEVEL SECURITY;
