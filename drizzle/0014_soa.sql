-- Statements of Advice: strategy library + SOA documents + recommendations

CREATE TABLE strategy_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'OTHER',
  type TEXT NOT NULL DEFAULT 'GENERIC',
  wording TEXT,
  benefits JSON NOT NULL DEFAULT '[]'::json,
  warnings JSON NOT NULL DEFAULT '[]'::json,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_id TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX strategy_template_org_idx ON strategy_template(organization_id);

CREATE TABLE soa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Statement of Advice',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  scope TEXT,
  intro TEXT,
  created_by_id TEXT REFERENCES "user"(id),
  updated_by_id TEXT REFERENCES "user"(id),
  issued_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX soa_client_idx ON soa(client_id);
CREATE INDEX soa_org_idx ON soa(organization_id);

ALTER TABLE soa
  ADD CONSTRAINT soa_status_check CHECK (status IN ('DRAFT', 'ISSUED'));

CREATE TABLE soa_recommendation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soa_id UUID NOT NULL REFERENCES soa(id) ON DELETE CASCADE,
  template_id UUID REFERENCES strategy_template(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'OTHER',
  type TEXT NOT NULL DEFAULT 'GENERIC',
  title TEXT NOT NULL,
  wording TEXT,
  benefits JSON NOT NULL DEFAULT '[]'::json,
  warnings JSON NOT NULL DEFAULT '[]'::json,
  data JSON NOT NULL DEFAULT '{}'::json,
  goal_ids JSON NOT NULL DEFAULT '[]'::json,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX soa_recommendation_soa_idx ON soa_recommendation(soa_id);
