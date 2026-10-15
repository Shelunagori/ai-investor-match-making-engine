# Safe database initialization

This fix was prepared locally for the reported deployment state: pgvector 0.8.2 in `public`, an empty `aether.records` table created manually, and no Render DATABASE_URL yet. No remote database was accessed during implementation.

## Seed an existing database

After configuring DATABASE_URL privately in your terminal, run from this checkout:

```sh
cd /Users/shelu/pl-code-new/ai-investor-match-making-engine
PYTHONPATH=backend .venv/bin/python scripts/database.py && \
  PYTHONPATH=backend .venv/bin/python scripts/verify_database.py
```

The second command is read-only. Running the pair again is safe. Expected first-run output reports 6 opportunities, 4 partners, 30 evidence records and 10 inserted; a second run reports 0 inserted. The deterministic benchmark verifies 9 eligible partnerships at the fixed fixture date, independently of today's evidence aging. No credentials or raw database error messages are printed.

Only after this succeeds, configure DATABASE_URL privately on the Render backend, restart it and check `/ready` for `repository: postgres`. This instruction does not authorize an automated remote connection in this task.

## Behavior and migration risks

- PostgreSQL's extension catalog identifies pgvector's actual namespace. SQL identifiers are quoted with `format('%I', ...)` in the migration and `psycopg.sql.Identifier` in Python. No search-path assumption, extension relocation, extension upgrade or destructive SQL is used.
- The original bootstrap migration is corrected in place because it must work on an untracked manually initialized database. If its filename is already recorded in `aether.schema_migrations`, it remains skipped; no corrective DDL is required for a valid existing table. If it is unrecorded, `CREATE ... IF NOT EXISTS` safely reuses the table and records the migration. External systems that enforce migration checksums will need an explicit review of this bootstrap-file change; this repository's runner tracks filenames, not checksums.
- Initialization uses a transaction and advisory transaction lock, with 10-second lock and 30-second statement timeouts. DDL, seed inserts and verification roll back together on failure. Brief locks may occur on the AETHER tables. Run with a database role allowed to create missing AETHER objects, read the catalog, seed rows and manage its RLS. Installing pgvector requires extension privileges only when it is absent.
- Existing unrelated records are never deleted or updated. A matching fixture ID with different `kind` or `payload` is treated as a collision, not permission to overwrite. This includes intentionally edited evidence. Resolve collisions manually after inspection; this command will not erase edits.
- Existing embeddings, embedding model metadata and timestamps are preserved. Verification compares the canonical payloads and their deterministic matching baseline; it does not claim to validate live embedding quality.
- An existing table must retain the expected columns and the installed `vector(768)` type. An incompatible shape aborts instead of being rewritten. `IF NOT EXISTS` is not a schema-repair mechanism.
- The canonical fixture is still defined solely in `backend/app/seed.py`. The repository reader already retrieves embeddings as text, so it needs no schema-specific type change. Runtime handling of arbitrary non-fixture records is outside this fix; verification intentionally scopes itself to the ten canonical IDs rather than deleting additional rows to force a count.

## Local tests

The integration tests only use `127.0.0.1` and an explicit `AETHER_TEST_DB_PORT`; they never use DATABASE_URL. Use a disposable PostgreSQL/pgvector container with a `postgres` role capable of creating isolated test databases. Each case creates its own database; container removal handles cleanup without destructive SQL. If the local service uses authentication, configure it privately through libpq environment settings.

```sh
AETHER_TEST_DB_PORT=55433 .venv/bin/python -m pytest -q
.venv/bin/ruff check backend scripts
.venv/bin/ruff format --check backend scripts
```

The default test run skips these integration cases unless the explicit port is supplied. The matrix covers `public`, `extensions`, absent extension, manually created tables with and without migration history, repeat initialization, exact evidence/model round trips through the repository, unrelated rows/tables, collision rollback, preserved embeddings/timestamps, incompatible vector dimensions and secret-safe error output.
