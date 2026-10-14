# Verification record — 2026-10-14

Local implementation is complete; remote publication and live provider deployment remain blocked/unverified.

## Executed checks

- Python domain/API suite: 13 passing tests, covering eligibility/rejection, missing/unknown fields, semantic scoring, evidence age/conflict/missingness, metric denominators, non-mutating scenarios, API validation, CORS, readiness failures and safe Cloudflare fallback/grounding/budgets.
- Frontend: TypeScript check, ESLint, three component tests and production build pass.
- Chromium desktop/mobile workflows: eight tests pass, covering decision inspection, explanation fallback, evidence review, scenario geography change, K-sensitive evaluation, filters/empty states, full five-step guided tour, viewport checks and axe serious/critical checks across all five screens.
- Local PostgreSQL 17 with pgvector 0.8.7: migration applied; seed run twice; exactly ten records remain; RLS enabled; identical vectors have cosine distance zero; database-backed readiness/dashboard/evaluation verified.
- npm audit: zero vulnerabilities. pip-audit against backend/requirements.lock: no known vulnerabilities. These are snapshots, not future security guarantees.
- Python formatting/lint and git diff whitespace checks pass. One upstream Starlette TestClient deprecation warning remains for its httpx compatibility path; tests succeed.
- Production assets are split into application, chart and motion chunks; no chunk exceeds Vite's 500 kB warning threshold.

## Visual inspection

Actual Chromium screenshots were captured and inspected for all five desktop screens and the mobile dashboard. Review found and fixed muted text contrast, mobile grid/absolute-label overflow, keyboard scrolling on tables, hidden-menu focus, and the mobile guided-tour entry's scrollability. No external fonts or paid visual assets are required. Screenshots are in docs/screenshots; full browser run artifacts are available locally in frontend/test-results and configured as CI artifacts.

## External blockers and limits

- `git push -u origin codex/aether` failed twice: GitHub HTTPS port 443 connection timeout (~75 seconds). The GitHub connector can read the repository, but attempting to create codex/aether returned HTTP 403 `Resource not accessible by integration`. No successful push or PR creation is claimed. Local commits remain intact and main was not modified.
- No Render connection or deployment credentials were available. No frontend/backend live URL has been verified.
- No DATABASE_URL or Cloudflare account/token environment variables were present. Supabase's connected account listed Investor Alpha, but the user has not confirmed the intended project; no remote schema changes were made. The PostgreSQL implementation was verified against an isolated local database instead.
- Cloudflare model/API shape was checked against current official documentation. Live inference and embeddings remain unverified without credentials; provider failure, malformed output and missing credentials are tested with mocks. The optional integration must not be described as live-working yet.
- GitHub Actions workflow exists but has not run remotely because publication is blocked.

## Human-access steps

1. Restore GitHub HTTPS connectivity and grant write access (Contents and Workflows where needed), then run `git push -u origin codex/aether`. Open a PR to main and inspect the CI run. No force push is needed.
2. Confirm the intended Supabase project, export its session-pooler DATABASE_URL server-side, then run the migration/seed and verification commands in DEPLOYMENT.md.
3. Connect Render, import render.yaml using only free resources, set the exact API/frontend origins, deploy and verify both assigned URLs.
4. Optionally supply a narrowly scoped Cloudflare token/account ID on the backend, invoke one explanation, verify mode=cloudflare and inspect provider usage. Run the bounded embedding script only after this succeeds.
