-- Rate-limit DOB verification on the public fact-find portal

ALTER TABLE fact_find_request
  ADD COLUMN dob_attempts INTEGER NOT NULL DEFAULT 0;
