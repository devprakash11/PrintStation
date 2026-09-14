begin;

create table if not exists upload_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  file_name varchar(255) not null,
  mime_type varchar(120) not null check(mime_type in ('application/pdf','image/jpeg','image/png','image/webp')),
  file_size bigint not null check(file_size > 0),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table print_jobs add column if not exists claimed_agent_id uuid references printer_agents(id) on delete set null;
alter table print_jobs add column if not exists claimed_at timestamptz;
alter table print_jobs add column if not exists retry_count integer not null default 0;

create index if not exists idx_jobs_claim on print_jobs(claimed_agent_id,status,claimed_at);
create index if not exists idx_upload_assets_expiry on upload_assets(expires_at,used_at);

commit;
