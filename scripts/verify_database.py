"""Read-only checks scoped to canonical fixture IDs; unrelated rows are untouched."""

import os
import sys
from datetime import date
import psycopg
from psycopg import sql
from app.database import vector_schema
from app.domain import evaluate
from app.models import Opportunity, Partner
from app.seed import dataset, AS_OF


def verify(conn):
    opportunities, partners = dataset()
    expected = {
        row.id: (kind, row.model_dump(mode="json", exclude={"embedding"}))
        for kind, rows in [("opportunity", opportunities), ("partner", partners)]
        for row in rows
    }
    actual = {
        rid: (kind, payload)
        for rid, kind, payload in conn.execute(
            "SELECT id, kind, payload FROM aether.records WHERE id = ANY(%s)",
            (list(expected),),
        ).fetchall()
    }
    if actual != expected:
        raise ValueError("Canonical fixture records differ or are missing.")
    loaded_opportunities = [
        Opportunity.model_validate(actual[o.id][1]) for o in opportunities
    ]
    loaded_partners = [Partner.model_validate(actual[p.id][1]) for p in partners]
    if len(loaded_opportunities) != 6 or len(loaded_partners) != 4:
        raise ValueError("Unexpected canonical fixture counts.")
    if sum(len(o.evidence) for o in loaded_opportunities) != 30:
        raise ValueError("Unexpected evidence count.")
    # Fix the benchmark date, not the production clock. Embeddings are preserved
    # separately; this verifies the canonical deterministic matching baseline.
    result = evaluate(loaded_opportunities, loaded_partners, date.fromisoformat(AS_OF))
    if (
        result != evaluate(opportunities, partners, date.fromisoformat(AS_OF))
        or result["denominators"]["returned"] != 9
        or result["regression"]["failures"] != 0
    ):
        raise ValueError("Canonical matching benchmark failed.")
    if not conn.execute(
        "SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='aether.records'::regclass"
    ).fetchone()[0]:
        raise ValueError("RLS is not enabled.")
    installed_schema = vector_schema(conn)
    column = conn.execute(
        "SELECT n.nspname, t.typname, a.atttypmod FROM pg_catalog.pg_attribute a "
        "JOIN pg_catalog.pg_type t ON t.oid=a.atttypid "
        "JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace "
        "WHERE a.attrelid='aether.records'::regclass AND a.attname='embedding' AND NOT a.attisdropped"
    ).fetchone()
    if column != (installed_schema, "vector", 768):
        raise ValueError(
            "Existing embedding column must use the installed vector(768) type."
        )
    schema = sql.Identifier(installed_schema)
    distance = conn.execute(
        sql.SQL(
            "SELECT '[1,0,0]'::{s}.vector OPERATOR({s}.<=>) '[1,0,0]'::{s}.vector"
        ).format(s=schema)
    ).fetchone()[0]
    if distance != 0:
        raise ValueError("pgvector cosine verification failed.")


def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL is not configured.", file=sys.stderr)
        return 1
    try:
        with psycopg.connect(url, connect_timeout=10) as conn:
            conn.execute("SET TRANSACTION READ ONLY")
            conn.execute("SET LOCAL statement_timeout = '30s'")
            verify(conn)
    except (psycopg.Error, ValueError):
        print(
            "Database verification failed. Check connection, schema and canonical fixture data locally; sensitive details suppressed.",
            file=sys.stderr,
        )
        return 1
    print(
        "Verified 6 opportunities, 4 partners, 30 evidence records, RLS, cosine and 9 eligible partnerships at the fixture benchmark date."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
