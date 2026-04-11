ALTER TABLE client
  ADD COLUMN partner_id UUID REFERENCES client(id) ON DELETE SET NULL,
  ADD COLUMN partner_relationship TEXT;

ALTER TABLE client
  ADD CONSTRAINT client_partner_relationship_check
  CHECK (partner_relationship IS NULL OR partner_relationship IN ('SPOUSE', 'PARTNER', 'DE_FACTO'));

CREATE INDEX client_partner_id_idx ON client(partner_id);
