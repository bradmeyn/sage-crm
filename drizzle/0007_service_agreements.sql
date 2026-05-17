CREATE TABLE service_agreement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  next_renewal_date TEXT NOT NULL,
  last_consent_date TEXT,
  fee_amount INTEGER NOT NULL,
  fee_frequency TEXT NOT NULL CHECK (fee_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')),
  services TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX service_agreement_client_idx ON service_agreement(client_id);
CREATE INDEX service_agreement_org_idx ON service_agreement(organization_id);
