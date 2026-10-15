"""Run from repository root: PYTHONPATH=backend .venv/bin/python scripts/database.py"""

import os
from pathlib import Path
import psycopg
from psycopg.types.json import Jsonb
from app.seed import dataset


def seed(conn):
    opportunities, partners = dataset()
    for kind, rows in [("opportunity", opportunities), ("partner", partners)]:
        for row in rows:
            conn.execute(
                "INSERT INTO aether.records (id, kind, payload) VALUES (%s,%s,%s) ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind, payload=EXCLUDED.payload",
                (
                    row.id,
                    kind,
                    Jsonb(row.model_dump(mode="json", exclude={"embedding"})),
                ),
            )
    return len(opportunities) + len(partners)


def migrate(conn):
    conn.execute("CREATE SCHEMA IF NOT EXISTS aether")
    conn.execute(
        "CREATE TABLE IF NOT EXISTS aether.schema_migrations (version text PRIMARY KEY, applied_at timestamptz DEFAULT now())"
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


if __name__ == "__main__":
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=10) as conn:
        migrate(conn)
        count = seed(conn)
        print(f"Migrations applied; {count} synthetic records upserted.")
