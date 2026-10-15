"""Explicit operator-only embedding job; ten fixed records, no public inference endpoint."""

import json
import os
import httpx
import psycopg
from psycopg import sql
from app.database import vector_schema

MODEL = "@cf/baai/bge-base-en-v1.5"


def main():
    account, token = (
        os.environ["CLOUDFLARE_ACCOUNT_ID"],
        os.environ["CLOUDFLARE_API_TOKEN"],
    )
    with psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=10) as conn:
        schema = sql.Identifier(vector_schema(conn))
        rows = conn.execute(
            "SELECT id,payload FROM aether.records WHERE embedding IS NULL ORDER BY id LIMIT 10"
        ).fetchall()
        if not rows:
            print("No missing embeddings; no inference requested.")
            return
        texts = [
            (r[1].get("description") or r[1].get("thesis", ""))[:1000] for r in rows
        ]
        response = httpx.post(
            f"https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{MODEL}",
            headers={"Authorization": f"Bearer {token}"},
            json={"text": texts},
            timeout=20,
        )
        response.raise_for_status()
        vectors = response.json()["result"]["data"]
        if len(vectors) != len(rows):
            raise ValueError("Embedding count mismatch")
        for (rid, _), vector in zip(rows, vectors):
            if len(vector) != 768 or any(
                not isinstance(v, (int, float)) for v in vector
            ):
                raise ValueError("Expected a 768-dimensional embedding")
            conn.execute(
                sql.SQL(
                    "UPDATE aether.records SET embedding=%s::{}.vector, embedding_model=%s WHERE id=%s"
                ).format(schema),
                (json.dumps(vector, allow_nan=False), MODEL, rid),
            )
        print(
            f"Embedded {len(rows)} records. Inspect Cloudflare usage dashboard for actual neurons."
        )


if __name__ == "__main__":
    main()
