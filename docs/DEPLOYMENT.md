# Deployment: $0 demo configuration

No live deployment is claimed. Configuration is in render.yaml; all core features also work without cloud credentials. Keep all services on free plans and do not enable paid overages. Free-tier eligibility and quotas are account-specific; check the provider dashboard before creating resources.

## Local

Use Node 22 and Python 3.13 (also tested locally on Node 20.20.1 and Python 3.14.7).

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.lock
AS_OF_DATE=2026-10-14 .venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies /api to port 8000. The application does not automatically load the root .env; export values in your shell or set them in Render. .env.example documents names. Never commit populated secrets.

## Supabase

1. Select the intended Free project; do not overwrite another application's schema. The connected account includes Investor Alpha, but project selection must be confirmed before applying remotely.
2. In Connect, copy the **session pooler** PostgreSQL URI (IPv4 compatible). Store it only as DATABASE_URL, with its password URL-encoded and `sslmode=require`. Do not expose it in frontend variables.
3. From the repository root, run:

```sh
PYTHONPATH=backend .venv/bin/python scripts/database.py
PYTHONPATH=backend .venv/bin/python scripts/database.py
PYTHONPATH=backend .venv/bin/python scripts/verify_database.py
```

The initializer applies missing versioned SQL, seeds and verifies in one transaction. It detects the installed pgvector schema (`public` or `extensions`) without moving or replacing the extension; if absent, it installs into `extensions`. It inserts missing canonical records only: six opportunities and four partners, including all 30 evidence records. Existing identical records, timestamps and embeddings remain unchanged. If a canonical ID contains different data, the whole transaction aborts without overwriting it. Unrelated IDs and tables are preserved, so a database with other records can legitimately contain more than ten total rows. See [database initialization safety](DATABASE_INITIALIZATION.md) for the manual-migration recovery path and local regression tests.
4. Start the backend with DATABASE_URL and confirm /ready says postgres and /api/dashboard returns six innovators. No fallback to fixtures occurs after a configured database fails; the API returns 503.
5. A privileged database owner is needed for migration. Before any real data, provision a separate read-only runtime role with schema usage, SELECT grants and a narrowly scoped RLS policy. Do not add aether to exposed Data API schemas.

Reference: [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector).

## Cloudflare Workers AI (optional)

1. Keep the account on the Workers Free plan. Create an API token limited to Workers AI access for the intended account. Set server-only CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.
2. Default model: `@cf/meta/llama-3.1-8b-instruct-fp8`. Its current documented API supports response_format. Override CLOUDFLARE_MODEL only after checking model availability and pricing. Set AI_DAILY_CALL_LIMIT=20 or lower.
3. Restart the backend. POST /api/opportunities/volt/explain/north once (the UI's Explain button does this). Success must return mode=cloudflare; deterministic mode with a provider-failure reason is not successful live AI verification. Readiness says configured, not connected, until a call succeeds. Tokens are never returned or logged.
4. Optional embeddings, with database and Cloudflare variables exported:

```sh
PYTHONPATH=backend .venv/bin/python scripts/embed.py
```

This requests at most ten missing embeddings using `@cf/baai/bge-base-en-v1.5` (768 dimensions), stores them in pgvector and skips populated records. Matching then adds 10% cosine relevance without overriding eligibility. Re-run the benchmark to inspect any ranking changes. Do not mix embedding models in the same corpus.

The local limiter is one attempt per 10 seconds and at most 20/day/process; max output 180 tokens, timeout 12 seconds, zero retries. Restart resets counters. Free-plan provider limits remain the ultimate $0 boundary. Approximate budget at 500 input + 180 output tokens per call is about 232 neurons/day for 20 calls using the model's published token/neurons conversion; actual tokenizer use and other account workloads vary. Verify dashboard usage. Embedding the tiny initial corpus is expected to consume tens of neurons, not a measured claim.

References: [model specification](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/), [Workers AI pricing and 10,000 free neurons/day](https://developers.cloudflare.com/workers-ai/platform/pricing/), [embedding model](https://developers.cloudflare.com/workers-ai/models/bge-base-en-v1.5/).

## Render

1. Connect the GitHub repository and select the AETHER feature branch (or merge its PR first).
2. Create a Blueprint from render.yaml. Review the preview: aether-api is a **Free web service**, aether-web is a **static site**. Reject any paid-resource change. No Render database is needed.
3. Set the backend DATABASE_URL to the Supabase pooler connection. For a credential-free demo, omit the variable in the service settings; the Blueprint may prompt for it, so manual service creation is also supported with the same commands.
4. Set backend CORS_ORIGINS to the exact assigned HTTPS static-site origin, without a trailing slash. Set frontend VITE_API_URL to the assigned API origin, without a trailing slash, and rebuild the static site. The variable is compiled into frontend assets.
5. Optionally add Cloudflare variables on the API service only. Leave AS_OF_DATE unset for real aging or set it to 2026-10-14 for the fixed interview benchmark, clearly describing it as a snapshot.
6. Verify the actual assigned URLs: API /health returns 200; /ready returns ready/postgres; /docs renders OpenAPI; frontend loads six records, explains a decision, runs an India scenario and shows evaluation results. Test mobile width and cross-origin fetch in the deployed browser. Only then call the deployment live.

Render's free backend can sleep after inactivity, has an ephemeral filesystem and limited memory; no heavyweight model or local persistent database is used. The UI exposes loading/error/retry states. Free static hosting and backend allowances are shared with other account usage. Do not use keep-alive traffic. References: [Render free services](https://render.com/docs/free), [Blueprint reference](https://render.com/docs/blueprint-spec).

## CI and recovery

GitHub Actions installs lockfiles, checks Python formatting/lint, executes backend tests, exercises PostgreSQL migration and repeated seed, type-checks/lints/tests/builds the frontend and runs desktop/mobile Chromium with axe. Screenshots/traces are uploaded as artifacts. Local tests are not proof that hosted CI ran; inspect the actual GitHub run.

If a provider is unavailable, leave AI unconfigured for deterministic operation. If PostgreSQL is configured but unavailable, repair the database connection rather than silently changing the source. Roll back application code using a previous Git commit; migrations are forward-only and this initial migration is additive.
