"""Integration assertions used by CI after applying and seeding twice."""

import os
import psycopg
from fastapi.testclient import TestClient
from app.main import app

with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
    assert conn.execute("SELECT count(*) FROM aether.records").fetchone()[0] == 10
    assert conn.execute(
        "SELECT relrowsecurity FROM pg_class WHERE oid='aether.records'::regclass"
    ).fetchone()[0]
    assert (
        conn.execute(
            "SELECT '[1,0,0]'::extensions.vector OPERATOR(extensions.<=>) '[1,0,0]'::extensions.vector"
        ).fetchone()[0]
        == 0
    )
client = TestClient(app)
assert client.get("/ready").json()["repository"] == "postgres"
assert client.get("/api/dashboard").json()["metrics"]["eligible_matches"] == 9
assert client.get("/api/evaluation").json()["regression"]["failures"] == 0
print(
    "Database integration verified: row counts, RLS, cosine, readiness, dashboard, benchmark."
)
