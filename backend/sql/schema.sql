CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff','operator')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL,
  model VARCHAR(120), ip_address VARCHAR(64), location VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline','maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE CASCADE,
  label VARCHAR(160) NOT NULL, token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  printer_id UUID NOT NULL REFERENCES printers(id) ON DELETE RESTRICT,
  copies INTEGER NOT NULL DEFAULT 1 CHECK (copies > 0), pages VARCHAR(100) NOT NULL DEFAULT 'all',
  color_mode VARCHAR(10) NOT NULL DEFAULT 'color' CHECK (color_mode IN ('color','bw')),
  paper_size VARCHAR(30) NOT NULL DEFAULT 'A4', orientation VARCHAR(12) NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait','landscape')),
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_job_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), print_job_id UUID NOT NULL REFERENCES print_jobs(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL, storage_path TEXT NOT NULL, mime_type VARCHAR(100), file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY, value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_print_jobs_printer ON print_jobs(printer_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_created_at ON print_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_printer ON qr_codes(printer_id);
CREATE INDEX IF NOT EXISTS idx_files_job ON print_job_files(print_job_id);

-- Keep application tables protected when using Supabase's Data API directly.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_job_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- The Express server connects with the database credentials and performs authorization itself.
-- Do not expose the database connection or service-role credentials to the browser.
