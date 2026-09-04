-- ============================================================
-- PrintStation — Database Hardening
-- ============================================================
-- Run this after schema.sql on an existing Supabase database.
-- The statements are idempotent where practical.

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users (role, status);
CREATE INDEX IF NOT EXISTS idx_printers_status ON printers (status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token_active ON qr_codes (token, is_active);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON qr_codes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_job_files_created_at ON print_job_files (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON system_settings (updated_at DESC);

-- Keep updated_at consistent for mutable application records.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_printers_updated_at ON printers;
CREATE TRIGGER trg_printers_updated_at
BEFORE UPDATE ON printers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_print_jobs_updated_at ON print_jobs;
CREATE TRIGGER trg_print_jobs_updated_at
BEFORE UPDATE ON print_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Prevent blank/whitespace-only values from entering core records.
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_name_not_blank,
  DROP CONSTRAINT IF EXISTS users_email_not_blank;

ALTER TABLE users
  ADD CONSTRAINT users_name_not_blank CHECK (length(trim(name)) >= 2),
  ADD CONSTRAINT users_email_not_blank CHECK (length(trim(email)) >= 5);

ALTER TABLE printers
  DROP CONSTRAINT IF EXISTS printers_name_not_blank;

ALTER TABLE printers
  ADD CONSTRAINT printers_name_not_blank CHECK (length(trim(name)) >= 2);

ALTER TABLE qr_codes
  DROP CONSTRAINT IF EXISTS qr_codes_label_not_blank;

ALTER TABLE qr_codes
  ADD CONSTRAINT qr_codes_label_not_blank CHECK (length(trim(label)) >= 1);

-- Useful defaults for a newly configured installation.
INSERT INTO system_settings (key, value)
VALUES
  ('site_name', '"PrintStation"'::jsonb),
  ('default_paper_size', '"A4"'::jsonb),
  ('default_color_mode', '"color"'::jsonb),
  ('default_orientation', '"portrait"'::jsonb),
  ('max_upload_size_mb', '20'::jsonb)
ON CONFLICT (key) DO NOTHING;
