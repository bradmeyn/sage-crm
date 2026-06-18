-- Client model: identity gaps, CRM fields, status lifecycle (replaces is_active)

ALTER TABLE client
  ADD COLUMN middle_name TEXT,
  ADD COLUMN gender TEXT,
  ADD COLUMN marital_status TEXT,
  ADD COLUMN residency_status TEXT,
  ADD COLUMN lead_source TEXT,
  ADD COLUMN client_since TEXT,
  ADD COLUMN is_vulnerable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN vulnerability_note TEXT;

-- status was effectively unused (always default 'PROSPECT'); derive the
-- lifecycle from the only real signal we had — is_active.
UPDATE client SET status = CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END;

ALTER TABLE client
  ADD CONSTRAINT client_status_check
    CHECK (status IN ('PROSPECT', 'ACTIVE', 'INACTIVE', 'FORMER')),
  ADD CONSTRAINT client_gender_check
    CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY')),
  ADD CONSTRAINT client_marital_status_check
    CHECK (marital_status IS NULL OR marital_status IN ('SINGLE', 'MARRIED', 'DE_FACTO', 'SEPARATED', 'DIVORCED', 'WIDOWED')),
  ADD CONSTRAINT client_residency_status_check
    CHECK (residency_status IS NULL OR residency_status IN ('AU_RESIDENT', 'FOREIGN_RESIDENT', 'TEMP_RESIDENT')),
  ADD CONSTRAINT client_lead_source_check
    CHECK (lead_source IS NULL OR lead_source IN ('REFERRAL', 'WEBSITE', 'EVENT', 'SOCIAL', 'EXISTING_CLIENT', 'OTHER'));

ALTER TABLE client DROP COLUMN is_active;
