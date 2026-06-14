-- Risk tolerance profile (one per client)

CREATE TABLE client_risk_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES client(id) ON DELETE CASCADE,
  answers JSON NOT NULL DEFAULT '{}'::json,
  category TEXT,
  confirmed_category TEXT,
  notes TEXT,
  created_by_id TEXT REFERENCES "user"(id),
  updated_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE client_risk_profile
  ADD CONSTRAINT client_risk_profile_category_check
  CHECK (category IS NULL OR category IN ('CONSERVATIVE','MODERATELY_CONSERVATIVE','BALANCED','GROWTH','HIGH_GROWTH'));

ALTER TABLE client_risk_profile
  ADD CONSTRAINT client_risk_profile_confirmed_check
  CHECK (confirmed_category IS NULL OR confirmed_category IN ('CONSERVATIVE','MODERATELY_CONSERVATIVE','BALANCED','GROWTH','HIGH_GROWTH'));
