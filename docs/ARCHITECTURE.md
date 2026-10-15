# AETHER architecture

A React/TypeScript/Vite client calls a small FastAPI service. Domain functions own eligibility, weighted ranking, evidence freshness, readiness and evaluation; HTTP handlers validate inputs and orchestrate repositories. All companies and evidence are fictional. Scores are decision-support indices, never probabilities.

The default repository is a deterministic JSON fixture; DATABASE_URL selects Supabase PostgreSQL. Versioned SQL creates private application tables with RLS and pgvector. Initialization discovers the installed pgvector schema and inserts missing canonical seeds atomically; existing differing fixture IDs cause rollback instead of an overwrite. No neural models run in Python. Optional Cloudflare inference may select grounded explanation statements but cannot change rules, scores or evidence. Missing credentials produce explicit deterministic fallback.

Scenarios are request-local copies, never writes. Unknown hard criteria yield review, known failures yield rejection. Only eligible candidates are recommended. Evidence includes provenance, timestamps and contradiction/review states. Readiness is an explicit heuristic with missing factors exposed.

Render serves the static client and one free Python process. Configurable CORS and server-only credentials separate the boundary. Public endpoints expose synthetic data only; no production confidential records should be added without authentication and tenant authorization.
