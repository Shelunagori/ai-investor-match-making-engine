# Engineering decisions

- Deterministic rules own eligibility. Known failure wins over unknown; unknown hard fields route to review. Neither scores nor AI can promote a rejected candidate.
- Explicit weights: mandate 40%, maturity 25%, evidence coverage 20%, freshness 15%. If both compatible embeddings exist, structured weights shrink to 90% and cosine relevance contributes 10%. These are product heuristics, not learned/calibrated probabilities.
- Seeded companies, source documents and verification labels are fictional. Fixed observation dates allow reproducible runs with AS_OF_DATE; production defaults to the current date so stale evidence actually ages.
- A private PostgreSQL schema, RLS without public policies and a server-only connection protect the data from the Supabase Data API. Only synthetic records are publicly served by FastAPI.
- The ten-record demo uses exact vectors and no HNSW index. Approximate retrieval is unnecessary here and can lose candidates after eligibility filtering.
- AI chooses statement IDs and evidence IDs from a closed vocabulary. Output is validated and rendered from deterministic text, avoiding unverifiable natural-language claims. This intentionally limits expressive generation.
- One process, zero retries, 12-second timeout, 180 output-token cap, 20 attempted explanation calls/day and one call/10 seconds bound optional inference locally. Counters reset on restart; the provider free plan is the authoritative hard billing boundary.
- Scenarios copy records and partner constraints in memory. No mutation endpoint exists. Human-review statuses are source metadata; the demo does not pretend to persist workflow approvals.
- Render free hosting is configured, with no warm-up pings or paid resource declarations. Actual deployment and provider connectivity require access checks.
