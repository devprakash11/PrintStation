create extension if not exists pgcrypto;

create table if not exists users (
 id uuid primary key default gen_random_uuid(), name varchar(120) not null, email varchar(255) not null unique,
 password_hash text not null, role varchar(20) not null default 'operator' check(role in ('admin','staff','operator')),
 status varchar(20) not null default 'active' check(status in ('active','disabled')),
 last_login_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists printer_agents (
 id uuid primary key default gen_random_uuid(), name varchar(120) not null, machine_name varchar(255), platform varchar(40) not null default 'windows',
 version varchar(40), secret_hash text not null, status varchar(20) not null default 'offline' check(status in ('online','offline')),
 last_seen_at timestamptz, registered_at timestamptz not null default now(), is_active boolean not null default true
);

create table if not exists printers (
 id uuid primary key default gen_random_uuid(), name varchar(120) not null, model varchar(160), agent_id uuid not null references printer_agents(id) on delete restrict,
 system_printer_name varchar(255) not null, location varchar(255), connection_type varchar(20) not null default 'other' check(connection_type in ('usb','wifi','ethernet','bluetooth','other')),
 capabilities jsonb not null default '{}'::jsonb, status varchar(20) not null default 'offline' check(status in ('online','offline','busy','error','maintenance')),
 is_enabled boolean not null default true, last_seen_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(agent_id,system_printer_name)
);

create table if not exists agent_pairings (
 id uuid primary key default gen_random_uuid(), code varchar(16) not null unique, created_by uuid references users(id) on delete set null,
 expires_at timestamptz not null, used_at timestamptz
);

create table if not exists qr_codes (
 id uuid primary key default gen_random_uuid(), printer_id uuid not null references printers(id) on delete cascade, label varchar(120), token uuid not null unique,
 expires_at timestamptz, is_active boolean not null default true, created_by uuid references users(id) on delete set null, created_at timestamptz not null default now()
);

create table if not exists print_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete set null, printer_id uuid not null references printers(id) on delete restrict,
 copies integer not null default 1 check(copies between 1 and 100), pages integer not null default 1 check(pages between 1 and 1000),
 color_mode varchar(10) not null default 'bw' check(color_mode in ('color','bw')), paper_size varchar(30) not null default 'A4', orientation varchar(20) not null default 'portrait' check(orientation in ('portrait','landscape')),
 status varchar(20) not null default 'queued' check(status in ('queued','accepted','downloading','printing','completed','failed','cancelled')),
 error_message text, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists print_job_files (
 id uuid primary key default gen_random_uuid(), print_job_id uuid not null references print_jobs(id) on delete cascade, file_name varchar(255) not null,
 storage_path text not null, mime_type varchar(120) not null, file_size bigint not null, created_at timestamptz not null default now()
);

create index if not exists idx_printers_agent on printers(agent_id);
create index if not exists idx_printers_status on printers(status);
create index if not exists idx_qr_token on qr_codes(token);
create index if not exists idx_jobs_queue on print_jobs(printer_id,status,created_at);
create index if not exists idx_jobs_created on print_jobs(created_at desc);
create index if not exists idx_agent_status on printer_agents(status);
