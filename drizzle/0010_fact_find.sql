-- Fact Find: health fields on client + dependants, estate, beneficiaries

ALTER TABLE client
  ADD COLUMN smoker BOOLEAN,
  ADD COLUMN health_status TEXT,
  ADD COLUMN height_cm INTEGER,
  ADD COLUMN weight_kg INTEGER;

ALTER TABLE client
  ADD CONSTRAINT client_health_status_check
  CHECK (health_status IS NULL OR health_status IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR'));

CREATE TABLE client_dependant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  relationship TEXT NOT NULL DEFAULT 'CHILD',
  financially_dependent BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by_id TEXT REFERENCES "user"(id),
  updated_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX client_dependant_client_id_idx ON client_dependant(client_id);

CREATE TABLE client_estate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES client(id) ON DELETE CASCADE,
  has_will BOOLEAN NOT NULL DEFAULT false,
  will_location TEXT,
  will_updated_date TEXT,
  executor TEXT,
  has_poa BOOLEAN NOT NULL DEFAULT false,
  poa_type TEXT,
  poa_attorney TEXT,
  has_guardianship BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by_id TEXT REFERENCES "user"(id),
  updated_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE client_estate
  ADD CONSTRAINT client_estate_poa_type_check
  CHECK (poa_type IS NULL OR poa_type IN ('FINANCIAL', 'MEDICAL', 'BOTH'));

CREATE TABLE client_beneficiary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'OTHER',
  allocation INTEGER,
  applies_to TEXT NOT NULL DEFAULT 'WILL',
  notes TEXT,
  created_by_id TEXT REFERENCES "user"(id),
  updated_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX client_beneficiary_client_id_idx ON client_beneficiary(client_id);
