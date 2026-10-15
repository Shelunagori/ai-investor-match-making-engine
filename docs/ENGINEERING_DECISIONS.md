# Engineering decisions and trade-offs

Baseline: `origin/main` at `4f078a3`, inspected 15 October 2026. The original [decision notes](DECISIONS.md) and [trade-offs](TRADEOFFS.md) record the demonstration's intent. The rationale below connects those notes to current code; it is not a claim that a formal technology comparison or performance study was conducted.

## Technology choices

| Implemented choice                                                     | Benefit for this application                                                                          | Trade-off and alternative                                                                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React, TypeScript and Vite static frontend                             | Interactive comparison, evidence and scenario views with a deployable static bundle                   | Hand-maintained API types can drift; generated OpenAPI clients/runtime validation would strengthen contracts. Server rendering is not currently needed by the demonstration. |
| FastAPI and Pydantic                                                   | Explicit HTTP/domain models and a small Python orchestration layer around deterministic functions     | Synchronous database reads and full-dataset computation limit concurrency. Async I/O or bounded worker execution plus pooling needs measurement before adoption.             |
| PostgreSQL JSONB with pgvector                                         | Keeps nested fixture payloads intact and supports optional vector storage in one database             | Few relational constraints inside JSONB; normalized/versioned entities become valuable for workflows, ownership, queryability and audit.                                     |
| Exact Python cosine similarity                                         | Transparent and sufficient for four partners; no approximate retrieval can omit an eligible candidate | Full reads and pairwise calculation do not scale indefinitely. SQL filtering and indexed retrieval need recall tests and an explicit relationship to hard eligibility.       |
| Cloudflare REST inference                                              | Optional model selection without adding a separate orchestration service                              | Provider format/latency can vary; constrained parsing and deterministic fallback limit impact. No claim is made about comparative cost or model quality.                     |
| Separate Render static and Python services, external Supabase database | Small deployment surface with separate public assets and server secrets                               | Provider/network dependencies and free-service constraints; no demonstrated availability or capacity guarantee.                                                              |

## Deterministic decisions, optional AI

Eligibility is an auditable set of mandate checks, with failure taking precedence over unknown and unknown requiring review. Weighted scoring orders candidates within status groups; it cannot promote a rejected or review candidate to eligible. The weights are explicit product heuristics, not learned success probabilities.

The LLM receives only preapproved statement text and evidence IDs. It selects a subset; strict validation requires the eligibility statement and permits only known IDs. Final text comes from deterministic templates. Consequently AI cannot override eligibility, alter scores, create evidence or introduce model-authored claims into an explanation. The frontend independently limits display to statements for the current match.

This sacrifices fluent open-ended synthesis for inspectability. A valid citation ID establishes membership in the supplied record set, not truth, verification or a proven causal link between a statement and a source. A future richer explanation system would need source retrieval, claim-level attribution, evaluation and an equally explicit authorization boundary; prompt instructions alone would not replace these controls.

The bounded parser tolerates the observed Cloudflare prose/fenced-JSON wrapper without repairing malformed output. Ambiguity fails closed into deterministic rendering. An alternative of accepting arbitrary model prose would remove the present closed-vocabulary guarantee.

## Evidence is separate from mandate compatibility

Recorded fields determine eligibility. Evidence coverage and freshness contribute to score; verification quality and contradictions are shown separately through readiness and review status. A pair can therefore be eligible with weak or conflicting evidence. The interface must keep the diligence warning visible rather than treating eligibility as approval.

Conflicts use same-factor distinct strings or an explicit disputed status. No winner is inferred. This is simple and reproducible, but can over-flag complementary statements and cannot recognize paraphrases or resolve temporal disagreement. Missing, unverified, stale and contradictory records remain distinct states. Fictional fixture verification labels are always disclosed as synthetic.

For real customers, retain source identity, immutable versions, collection timestamps, consent/usage rights and an auditable reviewer decision. Resolution should preserve earlier conflicting evidence rather than silently replace it. No such ingestion or review workflow exists today.

## Persistence and reproducibility

The canonical fixture is Python/Pydantic data. The database initializer inserts only missing canonical IDs, validates existing payloads and rolls back mismatches. This deliberately avoids overwriting customer-adjacent data or embedding fields. Extra unrelated IDs remain untouched. A changed fixture is not an implicit data-update migration: operators must explicitly design that transition.

Vector extension discovery accommodates existing namespace choices without moving or dropping extensions. Migration filenames provide an execution ledger, but not checksums or drift detection. Real release operations need migration review, schema drift detection, tested restores and controlled data-version transitions.

`AS_OF_DATE` enables reproducible freshness tests; production otherwise ages records against the server date. The fixed benchmark uses hand-authored labels for this fixture, so its precision/recall is a regression signal, not an estimate of performance on real companies. Arbitrary new IDs are outside the evaluation's current assumptions.

## Failure and degradation decisions

| Failure                                                   | Implemented behavior                                  | Remaining limitation                                                                          |
| --------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No database URL                                           | Canonical fixture repository                          | Misconfiguration can resemble a healthy demonstration; readiness exposes the source           |
| Configured database unavailable, empty or invalid         | Generic 503; no fixture substitution                  | No automatic recovery/failover beyond later requests                                          |
| Missing or unusable embeddings                            | Structured-only weights                               | Missing vectors change score composition; mixed model versions are not rejected by the reader |
| AI absent, throttled, exhausted, malformed or unavailable | Deterministic explanation with mode/reason            | Fallback is expected, not proof of provider health                                            |
| Client timeout/network error                              | Visible error/recovery state                          | No offline cache or automatic request retry strategy                                          |
| Opportunity/partner switched during a request             | Component identity and cleanup suppress stale display | Loaded evidence remains a snapshot until fetched again                                        |
| Unknown evidence reference                                | Unavailable evidence state                            | Does not reconstruct a missing source                                                         |

AI attempts are budgeted per process, not per account or user; restart resets and multiple workers weaken any aggregate cap. The HTTP timeout limits operations rather than the entire workflow. Public endpoint abuse protection and provider spending controls require separate measures. Provider billing guarantees cannot be inferred from application counters.

## Changes required for real customers and higher scale

Before confidential data, introduce identity, tenant ownership, authorization on every read and operation, least-privilege database roles and tested tenant isolation. RLS without tenant policies is not a multi-tenant design. Review public docs/endpoints, browser policy, secret rotation and data retention requirements.

Before operational reliance, add structured error monitoring, dependency-aware alerts, latency/error objectives, durable audit events, backup and restore drills, incident ownership and a rollback/recovery runbook. The configured `/health` probe does not establish repository readiness. Provider configuration and backup availability must be checked directly.

Before scale, measure representative workloads. Replace full-table reads with bounded queries; introduce connection pooling and concurrency controls; move embedding generation into an observable, idempotent queue if ingestion warrants it. Version embedding models and enforce compatibility. A shared quota store and API rate limiting would be required across workers. Indexed vector retrieval should be evaluated against deterministic eligibility and recall, not introduced solely because pgvector is installed.

Before claiming product accuracy, obtain appropriately licensed real data, validate provenance, define review ownership, test representative labeled cases and assess domain bias and calibration. Current synthetic examples and browser tests demonstrate mechanics, not commercial outcomes.
