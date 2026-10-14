# Security boundaries

This is a public synthetic-data POC, not a confidential deal room. Do not load personal data, confidential pitch decks or real investor mandates before implementing authentication, tenant isolation and retention policies. CORS is an explicit allowlist, not an authorization mechanism.

Credentials stay in server environment variables. DATABASE_URL and CLOUDFLARE_API_TOKEN must never have a VITE_ prefix. The frontend needs only the public API origin. .env files are ignored. Request logs include request ID, method, response status and duration, not bodies, tokens or DSNs. Repository failures return a generic 503 without connection strings.

The aether schema is private, with revoked PUBLIC permissions and RLS enabled on records and migration metadata. No anonymous Data API policy is installed. The initial deployment uses a privileged server-only database connection for migration; production should use separate migration and read-only runtime roles with explicit policies. SQL input values are parameterized.

AI receives only deterministic rule statements and evidence IDs, never user-authored prompts or source text. Strict structured-output validation checks IDs and requires the status statement. Model-selected IDs cannot alter rules or scores. Provider errors, malformed JSON, invalid citations and local usage limits return deterministic explanations. No retries occur. Current local rate counters are process-local; restarts reset them. Keep Cloudflare on its Free plan to enforce the cost ceiling; add durable shared budgeting before scaling or enabling paid overages.

The optional operator-only embedding script processes at most ten missing vectors; validates dimensions and finite JSON numbers; and is idempotent for populated rows. Source embeddings are not proof of truth. No hash chain or immutability claim is made.

Browser tests run axe serious/critical checks, keyboard-accessible controls, visible focus rings, skip navigation and reduced-motion preferences. Automated accessibility checks supplement visual inspection and do not constitute a full WCAG audit.
