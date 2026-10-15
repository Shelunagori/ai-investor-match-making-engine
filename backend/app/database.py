"""Catalog-based pgvector schema discovery, independent of search_path."""


def vector_schema(conn):
    row = conn.execute(
        "SELECT n.nspname FROM pg_catalog.pg_extension e "
        "JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace "
        "WHERE e.extname = %s",
        ("vector",),
    ).fetchone()
    if row is None:
        raise ValueError(
            "pgvector is not installed; run database initialization first."
        )
    return row[0]
