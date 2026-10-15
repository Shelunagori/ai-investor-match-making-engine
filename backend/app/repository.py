import os
import json
from .seed import dataset
from .models import Opportunity, Partner


class Repository:
    def all(self):
        url = os.getenv("DATABASE_URL")
        if not url:
            return dataset()
        import psycopg

        with psycopg.connect(url, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT payload, embedding::text FROM aether.records WHERE kind = %s ORDER BY id",
                    ("opportunity",),
                )
                opportunities = [
                    Opportunity.model_validate(
                        {**r[0], "embedding": json.loads(r[1]) if r[1] else None}
                    )
                    for r in cur.fetchall()
                ]
                cur.execute(
                    "SELECT payload, embedding::text FROM aether.records WHERE kind = %s ORDER BY id",
                    ("partner",),
                )
                partners = [
                    Partner.model_validate(
                        {**r[0], "embedding": json.loads(r[1]) if r[1] else None}
                    )
                    for r in cur.fetchall()
                ]
        if not opportunities or not partners:
            raise RuntimeError("Database requires seed data")
        return opportunities, partners
