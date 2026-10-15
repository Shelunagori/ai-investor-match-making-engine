"""Opt-in PostgreSQL tests: only connect to loopback; never read DATABASE_URL."""

import os
from pathlib import Path
from uuid import uuid4
from datetime import date
import psycopg
from psycopg import sql
from psycopg.types.json import Jsonb
import pytest
import database
import verify_database
from app.database import vector_schema
from app.domain import evaluate
from app.repository import Repository
from app.seed import dataset, AS_OF

MIGRATION = (
    Path(__file__).resolve().parents[2]
    / "supabase/migrations/20261014161050_aether_initial.sql"
)


@pytest.fixture
def db():
    port = os.getenv("AETHER_TEST_DB_PORT")
    if not port:
        pytest.skip(
            "Set AETHER_TEST_DB_PORT for isolated loopback PostgreSQL integration tests"
        )
    params = dict(host="127.0.0.1", port=int(port), user="postgres", connect_timeout=5)
    name = "aether_test_" + uuid4().hex
    with psycopg.connect(**params, dbname="postgres", autocommit=True) as admin:
        admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
    # Each test has its own DB. Container teardown removes these databases;
    # no destructive SQL is needed, including during test cleanup.
    with psycopg.connect(**params, dbname=name, autocommit=True) as conn:
        yield conn, {**params, "dbname": name}


@pytest.mark.parametrize("schema", ["public", "extensions", None])
def test_fresh_and_preinstalled_extension(db, schema, monkeypatch):
    conn, params = db
    if schema:
        conn.execute(
            sql.SQL("CREATE SCHEMA IF NOT EXISTS {}").format(sql.Identifier(schema))
        )
        conn.execute(
            sql.SQL("CREATE EXTENSION vector WITH SCHEMA {}").format(
                sql.Identifier(schema)
            )
        )
    assert database.initialize(conn) == 10
    assert vector_schema(conn) == (schema or "extensions")
    extension_oid = conn.execute(
        "SELECT oid FROM pg_extension WHERE extname='vector'"
    ).fetchone()[0]
    before = conn.execute("SELECT * FROM aether.records ORDER BY id").fetchall()
    assert database.initialize(conn) == 0
    assert conn.execute("SELECT * FROM aether.records ORDER BY id").fetchall() == before
    assert (
        conn.execute("SELECT oid FROM pg_extension WHERE extname='vector'").fetchone()[
            0
        ]
        == extension_oid
    )
    assert dict(
        conn.execute(
            "SELECT kind,count(*) FROM aether.records GROUP BY kind"
        ).fetchall()
    ) == {"opportunity": 6, "partner": 4}
    verify_database.verify(conn)
    # Exercise the real repository without exposing/using any external DSN.
    connect = psycopg.connect
    monkeypatch.setenv("DATABASE_URL", "local-test-sentinel")
    monkeypatch.setattr(psycopg, "connect", lambda *args, **kwargs: connect(**params))
    assert database.main() == 0
    assert verify_database.main() == 0
    opportunities, partners = Repository().all()
    assert {o.id: o.model_dump() for o in opportunities} == {
        o.id: o.model_dump() for o in dataset()[0]
    }
    assert {p.id: p.model_dump() for p in partners} == {
        p.id: p.model_dump() for p in dataset()[1]
    }
    result = evaluate(opportunities, partners, date.fromisoformat(AS_OF))
    assert result["denominators"]["evidence"] == 30
    assert result["denominators"]["returned"] == 9
    assert result["regression"]["failures"] == 0


@pytest.mark.parametrize("recorded", [False, True])
def test_manually_created_public_table_and_unrelated_data(db, recorded):
    conn, _ = db
    conn.execute("CREATE EXTENSION vector WITH SCHEMA public")
    conn.execute("CREATE SCHEMA aether")
    conn.execute(
        "CREATE TABLE aether.records (id text PRIMARY KEY, kind text NOT NULL, payload jsonb NOT NULL, embedding public.vector(768), embedding_model text, updated_at timestamptz NOT NULL DEFAULT now())"
    )
    conn.execute("ALTER TABLE aether.records ENABLE ROW LEVEL SECURITY")
    if recorded:
        conn.execute(
            "CREATE TABLE aether.schema_migrations (version text PRIMARY KEY, applied_at timestamptz DEFAULT now())"
        )
        conn.execute(
            "INSERT INTO aether.schema_migrations(version) VALUES (%s)",
            (MIGRATION.name,),
        )
    conn.execute(
        "CREATE TABLE public.unrelated_data (id integer PRIMARY KEY, value text)"
    )
    conn.execute("INSERT INTO public.unrelated_data VALUES (1,'preserve me')")
    conn.execute(
        "INSERT INTO aether.records(id,kind,payload) VALUES ('unrelated','partner',%s)",
        (Jsonb({"preserve": True}),),
    )
    before = conn.execute(
        "SELECT * FROM aether.records WHERE id='unrelated'"
    ).fetchone()
    assert database.initialize(conn) == 10
    assert database.initialize(conn) == 0
    assert (
        conn.execute("SELECT * FROM aether.records WHERE id='unrelated'").fetchone()
        == before
    )
    assert conn.execute("SELECT * FROM public.unrelated_data").fetchall() == [
        (1, "preserve me")
    ]
    assert conn.execute("SELECT count(*) FROM aether.records").fetchone()[0] == 11
    assert vector_schema(conn) == "public"
    verify_database.verify(conn)


def test_collision_rolls_back_without_overwriting(db):
    conn, _ = db
    conn.execute(MIGRATION.read_text())
    conn.execute(
        "INSERT INTO aether.records(id,kind,payload) VALUES ('carbon','opportunity',%s)",
        (Jsonb({"existing": "not a fixture"}),),
    )
    before = conn.execute("SELECT * FROM aether.records").fetchall()
    with pytest.raises(database.SeedConflict):
        database.initialize(conn)
    assert conn.execute("SELECT * FROM aether.records").fetchall() == before
    assert (
        conn.execute("SELECT to_regclass('aether.schema_migrations')").fetchone()[0]
        is None
    )


def test_existing_embeddings_and_timestamps_are_preserved(db):
    conn, _ = db
    assert database.initialize(conn) == 10
    schema = sql.Identifier(vector_schema(conn))
    conn.execute(
        sql.SQL(
            "UPDATE aether.records SET embedding=%s::{}.vector, embedding_model='test-model' WHERE id='volt'"
        ).format(schema),
        ("[" + ",".join(["1"] + ["0"] * 767) + "]",),
    )
    before = conn.execute("SELECT * FROM aether.records ORDER BY id").fetchall()
    assert database.initialize(conn) == 0
    assert conn.execute("SELECT * FROM aether.records ORDER BY id").fetchall() == before


def test_failure_output_does_not_echo_connection_details(monkeypatch, capsys):
    monkeypatch.setenv("DATABASE_URL", "local-test-sentinel")

    def fail(*args, **kwargs):
        raise psycopg.OperationalError("SENSITIVE_SENTINEL")

    monkeypatch.setattr(psycopg, "connect", fail)
    assert database.main() == 1
    assert verify_database.main() == 1
    output = capsys.readouterr()
    assert "SENSITIVE_SENTINEL" not in output.err + output.out


def test_incompatible_embedding_column_aborts_without_changing_table(db):
    conn, _ = db
    conn.execute("CREATE EXTENSION vector WITH SCHEMA public")
    conn.execute("CREATE SCHEMA aether")
    conn.execute(
        "CREATE TABLE aether.records (id text PRIMARY KEY, kind text NOT NULL, payload jsonb NOT NULL, embedding public.vector(3), embedding_model text, updated_at timestamptz NOT NULL DEFAULT now())"
    )
    with pytest.raises(ValueError, match="vector"):
        database.initialize(conn)
    assert conn.execute("SELECT count(*) FROM aether.records").fetchone()[0] == 0
    assert (
        conn.execute(
            "SELECT atttypmod FROM pg_attribute WHERE attrelid='aether.records'::regclass AND attname='embedding'"
        ).fetchone()[0]
        == 3
    )
