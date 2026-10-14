-- Private schema: deliberately excluded from Supabase Data API.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
create schema if not exists aether;
revoke all on schema aether from public;
create table if not exists aether.records (
  id text primary key,
  kind text not null check (kind in ('opportunity', 'partner')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  embedding extensions.vector(768),
  embedding_model text,
  updated_at timestamptz not null default now()
);
create index if not exists records_kind_id_idx on aether.records(kind, id);
alter table aether.records enable row level security;
revoke all on aether.records from public;
-- No public policies. The backend connects using a server-only database role.
-- At demo scale, exact cosine evaluation avoids approximate-index recall loss.
