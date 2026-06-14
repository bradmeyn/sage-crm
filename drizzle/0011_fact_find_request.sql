-- Client-facing fact-find requests (tokenised links + staged answers)

CREATE TABLE fact_find_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  requested_sections JSON NOT NULL DEFAULT '[]'::json,
  response_data JSON NOT NULL DEFAULT '{}'::json,
  status TEXT NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  submitted_at TIMESTAMP,
  created_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE fact_find_request
  ADD CONSTRAINT fact_find_request_status_check
  CHECK (status IN ('PENDING', 'SUBMITTED', 'IMPORTED', 'EXPIRED', 'REVOKED'));

CREATE INDEX fact_find_request_client_id_idx ON fact_find_request(client_id);
CREATE INDEX fact_find_request_org_id_idx ON fact_find_request(organization_id);
