-- Private schema: deliberately excluded from Supabase Data API.
-- Discover an existing pgvector installation; never move or replace it.
do $migration$
declare
  vector_schema name;
begin
  select n.nspname into vector_schema
  from pg_catalog.pg_extension e
  join pg_catalog.pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'vector';

  if vector_schema is null then
    create schema if not exists extensions;
    create extension if not exists vector with schema extensions;
    select n.nspname into vector_schema
    from pg_catalog.pg_extension e
    join pg_catalog.pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector';
  end if;

  create schema if not exists aether;
  execute format($ddl$
    create table if not exists aether.records (
      id text primary key,
      kind text not null check (kind in ('opportunity', 'partner')),
      payload jsonb not null check (jsonb_typeof(payload) = 'object'),
      embedding %I.vector(768),
      embedding_model text,
      updated_at timestamptz not null default now()
    )
  $ddl$, vector_schema);
end
$migration$;
revoke all on schema aether from public;
create index if not exists records_kind_id_idx on aether.records(kind, id);
alter table aether.records enable row level security;
revoke all on aether.records from public;
-- No public policies. The backend connects using a server-only database role.
-- At demo scale, exact cosine evaluation avoids approximate-index recall loss.
