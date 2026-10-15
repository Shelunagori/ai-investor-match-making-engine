# Production readiness

Assessment date: 15 October 2026. Source baseline: `origin/main` at `4f078a3`. **AETHER is a working public synthetic demonstration, not a confidential multi-tenant customer system.** Companies, dossiers, evidence and verification labels are fictional. An evidence label of “verified” is a fixture value, not independent verification.

“Implemented” below means supported by inspected source. “Verified” refers to a stated test run or observation; it does not imply continuous assurance. Recommendations describe work not yet delivered. Older [verification notes](VERIFICATION.md) and [deployment notes](DEPLOYMENT.md) retain historical pre-deployment statements; the dated production observations here supersede those availability statements, not their historical test record.

## Implemented and verification scope

| Capability                                                    | Source evidence                                                                                                              | Verification boundary                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Deterministic eligibility and weighted ranking                | [domain.py](../backend/app/domain.py), [domain tests](../backend/tests/test_domain.py)                                       | Local regression tests; selected production decisions observed                                            |
| Read-only dashboard, details and scenarios                    | [main.py](../backend/app/main.py), [API tests](../backend/tests/test_api.py)                                                 | Local tests and production browser journey                                                                |
| Evidence provenance display, conflicts and missing references | [Trust.tsx](../frontend/src/Trust.tsx), [Trust tests](../frontend/src/Trust.test.tsx)                                        | Local tests and one production citation mapping                                                           |
| Strict AI selection and deterministic fallback                | [ai.py](../backend/app/ai.py), [AI tests](../backend/tests/test_ai.py)                                                       | Local failure/parser tests; one successful production Cloudflare explanation                              |
| Safe migration and repeatable canonical seed                  | [database.py](../scripts/database.py), [database tests](../backend/tests/test_database.py)                                   | Historical local PostgreSQL tests; production browser smoke did not inspect DB grants or rerun migrations |
| Keyboard dialogs, short-viewport scrolling and announcements  | [Trust.tsx](../frontend/src/Trust.tsx), [App.tsx](../frontend/src/App.tsx), [browser tests](../frontend/e2e/journey.spec.ts) | Local Chromium/axe regressions; production Escape/focus and mobile checks                                 |
| Optional vector storage/generation                            | [migration](../supabase/migrations/20261014161050_aether_initial.sql), [embed.py](../scripts/embed.py)                       | Local vector checks; production embedding generation and model consistency not verified                   |

## Local verification record

These are completed runs from preceding implementation/release work in this development session, not new executions during this documentation-only change:

- Frontend at accessibility commit `f516d092908061c175ef2b92be21697be3dd7ee8` (included in the inspected main): **33 Vitest tests and 30 Playwright tests passed**. Typecheck, ESLint, production build and formatting checks passed.
- Playwright covered desktop Chromium and mobile-emulated Chromium, evidence selection, stale state, dialog Escape/focus restoration/reopening, announcements and constrained 640×512 / 320×256 CSS viewports. The latter approximate 200% / 400% zoom geometry; they are not a manual browser-zoom or screen-reader speech audit. Automated axe checks covered serious/critical findings in the tested views.
- Backend at the preceding AI parsing fix: **60 passed, 8 database integration tests skipped**, with a Starlette/httpx TestClient deprecation warning. This is historical backend validation, not a fresh full-main run.
- The earlier database initialization change passed a **22-test local PostgreSQL 17 / pgvector 0.8.2 matrix** at that stage. This count belongs to that earlier test suite and must not be added to the later suite count.

[CI](../.github/workflows/ci.yml) defines Ruff, pytest, a PostgreSQL service, two initialization runs plus database verification, frontend checks and Chromium Playwright. The separate database matrix tests require an explicit loopback test port; the workflow's seed verification is not evidence that every matrix variant ran. Hosted CI status for the current merge was not inspected for this documentation task.

## Production verification: 15 October 2026

A read-only Playwright smoke test used real headless Chromium against:

- [Frontend](https://ai-investor-match-making-engine.onrender.com)
- [Backend](https://aether-api-cl6b.onrender.com)

The run began at 16:30 UTC. Desktop and mobile screenshots plus a JSON report were captured locally outside the repository; they are session artifacts, not durable CI artifacts committed with these documents. No production records, configuration or application code were changed. Explanation inference consumed a normal request from the existing AI budget.

| Check                         | Observed result                                                                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Health and readiness          | HTTP 200; readiness reported PostgreSQL, six opportunities and four partners. AI readiness only asserted configuration, not connectivity. |
| Dashboard                     | Six opportunities and four partners loaded                                                                                                |
| CarbonArc → Northstar Climate | Rejected, weighted score 28.7                                                                                                             |
| Explain this decision         | HTTP 200, `mode: cloudflare`, reason “AI-selected, deterministically rendered statements”                                                 |
| Evidence citation             | `carbon-e0` opened “CarbonArc / fictional dossier §1”, technology factor, unverified status and synthetic disclosure                      |
| Escape and focus              | Dialog closed and focus returned to its trigger                                                                                           |
| Scenario capital $8M → $25M   | VoltWeave's Northstar and Atlas results changed from eligible to rejected on capital range; score delta stayed zero                       |
| Persistence boundary          | Read opportunity/trust data before and after matched; stored capital remained $8M                                                         |
| Mobile 390×844                | All five inspected views had document scroll width equal to viewport width; dialog controls and final metadata were reachable             |
| Network and browser errors    | Fourteen observed navigation/API responses were HTTP 200; no console errors, page errors or failed requests were captured                 |

A horizontally scrollable opportunity table was intentional: its offscreen Inspect control became reachable by scrolling. An initial test-harness assertion treated that control as clipped; the follow-up interaction confirmed reachability. It was not classified as a product failure.

**Production smoke result: PASS for the tested journey.** It does not verify all opportunity/partner pairs, every fallback path, physical mobile devices, manual assistive technology, backend load, deployed commit identity, database privileges, backups or ongoing availability. The successful Cloudflare call demonstrates connectivity at that moment; deterministic fallback remains a legitimate response on subsequent calls.

## Partial and absent production capabilities

| Area                        | Current implementation                                                      | Gap before customer reliance                                                                                              |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Authentication              | None; public demonstration                                                  | Identity/session lifecycle and account recovery                                                                           |
| Authorization and isolation | No tenant fields or API permission checks; schema grants/RLS in migration   | Tenant ownership, scoped queries, policies, role audit and cross-tenant tests; owners/bypass roles can bypass current RLS |
| Secrets                     | Backend environment configuration; frontend API URL is intentionally public | No demonstrated rotation, secret-store audit or deployed access review                                                    |
| Monitoring                  | Request ID, basic duration/status logging, `/health` and `/ready`           | No implemented alerting, distributed tracing, error aggregation or service objectives                                     |
| Rate limiting               | Process-local AI attempt interval/day budget                                | No general API/user/IP rate limit or distributed quota; restarts reset AI counters                                        |
| Backups                     | External database provider, no repository backup automation                 | Provider backup configuration unverified; no demonstrated restore or recovery-point/time objective                        |
| Load and capacity           | One configured worker, full repository reads and Python matching            | No load/soak test or measured concurrency envelope; pooling and query bounds need evaluation                              |
| Real-data ingestion         | Canonical fixture seeding; optional operator embedding script               | No authenticated import pipeline, source acquisition, deduplication, retention or consent management                      |
| Evidence verification       | Metadata display and deterministic conflict flags                           | No independent verification, persisted review decisions or dispute-resolution workflow                                    |
| Audit                       | Request logs only                                                           | No immutable user/data-change audit trail                                                                                 |
| Recovery and releases       | Transactional initializer, generic errors, deployment instructions          | No demonstrated failover, restore drill, rollback rehearsal or incident runbook; migration ledger has no checksums        |
| Browser security            | CORS and several static security headers                                    | CORS is not authorization; no CSP configured; no penetration-test claim                                                   |
| AI reliability              | Strict selection validation, no retries, deterministic fallback             | Local limits are not account-wide spend controls; whole HTTP envelope is not size bounded by the selection parser         |
| Evaluation                  | Fixed hand-labeled synthetic benchmark                                      | No real-world accuracy/calibration validation; arbitrary new IDs are outside benchmark assumptions                        |

## Release and demonstration posture

The current system supports demonstrating transparent rules, score decomposition, evidence inspection, nonpersistent scenarios and bounded optional AI explanations. Keep synthetic notices and human-diligence language visible. Do not describe eligibility as investment approval, readiness as certification, or Cloudflare selection as evidence verification.

Before storing confidential customer information, authentication, authorization and tenant isolation are release blockers. Before availability or recovery commitments, establish and test monitoring, backups, restores, incident procedures and representative capacity. Before claims about decision quality, validate real-data provenance and a representative evaluation set.

This documentation change does not push, deploy, alter infrastructure or certify provider settings. Documentation checks and the documentation commit are reported with the change; application test results above retain their original scope and dates.
