"""Atomic, non-destructive initialization from the canonical synthetic fixture."""

import os
import sys
from pathlib import Path
import psycopg
from psycopg.types.json import Jsonb
from app.seed import dataset


class SeedConflict(ValueError):
    """An existing canonical ID belongs to different data; never overwrite it."""


def seed(conn):
    opportunities, partners = dataset()
    inserted = 0
    for kind, rows in [("opportunity", opportunities), ("partner", partners)]:
        for row in rows:
            payload = row.model_dump(mode="json", exclude={"embedding"})
            result = conn.execute(
                "INSERT INTO aether.records (id, kind, payload) VALUES (%s,%s,%s) "
                "ON CONFLICT (id) DO NOTHING RETURNING id",
                (row.id, kind, Jsonb(payload)),
            ).fetchone()
            inserted += result is not None
            existing = conn.execute(
                "SELECT kind, payload FROM aether.records WHERE id=%s FOR UPDATE",
                (row.id,),
            ).fetchone()
            if existing != (kind, payload):
                raise SeedConflict(
                    "A canonical fixture ID already contains different data; "
                    "initialization aborted without overwriting it."
                )
    return inserted


def migrate(conn):
    conn.execute("CREATE SCHEMA IF NOT EXISTS aether")
    conn.execute(
        "CREATE TABLE IF NOT EXISTS aether.schema_migrations "
        "(version text PRIMARY KEY, applied_at timestamptz DEFAULT now())"
    )
    conn.execute("ALTER TABLE aether.schema_migrations ENABLE ROW LEVEL SECURITY")
    for path in sorted(
        (Path(__file__).resolve().parents[1] / "supabase/migrations").glob("*.sql")
    ):
        if not conn.execute(
            "SELECT 1 FROM aether.schema_migrations WHERE version=%s", (path.name,)
        ).fetchone():
            conn.execute(path.read_text())
            conn.execute(
                "INSERT INTO aether.schema_migrations(version) VALUES (%s)",
                (path.name,),
            )


def initialize(conn):
    # One transaction/savepoint covers DDL, all ten records and verification.
    # Serialize concurrent initializers without locking unrelated application data.
    from verify_database import verify

    with conn.transaction():
        conn.execute("SET LOCAL lock_timeout = '10s'")
        conn.execute("SET LOCAL statement_timeout = '30s'")
        conn.execute("SELECT pg_advisory_xact_lock(%s, %s)", (16440, 1))
        migrate(conn)
        inserted = seed(conn)
        verify(conn)
    return inserted


def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not configured; nothing changed.", file=sys.stderr)
        return 1
    try:
        with psycopg.connect(url, connect_timeout=10) as conn:
            inserted = initialize(conn)
    except SeedConflict as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except (psycopg.Error, ValueError):
        # Provider errors can include connection details or source payloads.
        print(
            "Initialization failed; transaction rolled back. Check connectivity, permissions and schema compatibility locally. Details suppressed to protect credentials.",
            file=sys.stderr,
        )
        return 1
    print(
        f"Verified 6 opportunities, 4 partners and 30 evidence records; {inserted} inserted. Existing records preserved."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
