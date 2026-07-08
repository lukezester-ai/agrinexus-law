-- Застраховки — insurance policies and claims
CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_number text NOT NULL,
  type text NOT NULL DEFAULT 'crop',
  insurer_name text NOT NULL,
  broker_name text,
  insured_entity_type text,
  insured_entity_id text,
  insured_item_name text,
  coverage_details jsonb,
  start_date timestamp NOT NULL,
  end_date timestamp NOT NULL,
  premium_amount numeric(15,2) NOT NULL DEFAULT '0',
  coverage_amount numeric(15,2) NOT NULL DEFAULT '0',
  deductible numeric(15,2) DEFAULT '0',
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  claim_number text NOT NULL,
  claim_date timestamp NOT NULL DEFAULT now(),
  description text NOT NULL,
  amount_claimed numeric(15,2) NOT NULL DEFAULT '0',
  amount_settled numeric(15,2) DEFAULT '0',
  status text NOT NULL DEFAULT 'filed',
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
