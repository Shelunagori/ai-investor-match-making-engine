import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  FileText,
  GitBranch,
  ShieldCheck,
  Layers3,
  FlaskConical,
} from "lucide-react";
import "./review.css";

const repository =
  "https://github.com/Shelunagori/ai-investor-match-making-engine";
const documentLink = (name: string) =>
  `${repository}/blob/main/docs/${name}.md`;
const sections = [
  ["overview", "Overview"],
  ["capabilities", "Capabilities"],
  ["architecture", "Architecture"],
  ["decision-flow", "Decision flow"],
  ["evidence", "Evidence"],
  ["scenario", "Scenario Lab"],
  ["boundaries", "Boundaries"],
  ["verification", "Verification"],
  ["decisions", "Decisions"],
  ["readiness", "Readiness"],
] as const;
const examples = [
  {
    title: "Eligible match",
    pair: "VoltWeave → Northstar Climate",
    status: "Eligible",
    rule: "All applicable mandate checks pass.",
    detail:
      "Eligibility is compatibility with recorded fields, not investment approval. Disputed evidence still needs human diligence.",
  },
  {
    title: "Rejected match",
    pair: "CarbonArc → Northstar Climate",
    status: "Rejected",
    rule: "Sector and geography fail; stage is unknown.",
    detail:
      "A known hard-rule failure takes precedence over unknown information. A score cannot rescue this candidate.",
  },
  {
    title: "Unknown / review-required rule",
    pair: "CarbonArc → Frontier Transition",
    status: "Review required",
    rule: "Funding stage is Unknown, with no failed hard rule.",
    detail:
      "The system routes uncertainty to review rather than inventing a stage or recommending an unqualified candidate.",
  },
  {
    title: "AI provider unavailable",
    pair: "VoltWeave → Northstar Climate",
    status: "Deterministic fallback",
    rule: "Eligibility remains eligible even when inference is unavailable.",
    detail:
      "Missing credentials, local limits, HTTP errors or invalid output return preapproved deterministic statements. This tab illustrates that failure path; it is not a live provider check.",
  },
];
const decisions = [
  [
    "01",
    "Rules own the decision",
    "The LLM selects statement IDs. Python owns eligibility, scoring and final explanation text.",
  ],
  [
    "02",
    "Gate first, rank second",
    "Eligible, review and rejected are separate groups. Weighted scores rank within those groups; they are not confidence probabilities.",
  ],
  [
    "03",
    "Keep disagreement visible",
    "Distinct values for one evidence factor flag a conflict. No source is silently promoted to truth or discarded.",
  ],
  [
    "04",
    "Make AI optional",
    "Strict parsing and grounding reject ambiguous selections. A provider failure preserves the deterministic explanation.",
  ],
  [
    "05",
    "Use vectors deliberately",
    "PostgreSQL stores optional 768-dimensional vectors. Exact Python cosine is enough for four partners; no approximate index is needed.",
  ],
  [
    "06",
    "Keep operations legible",
    "A static frontend, one Python service and an external database keep the deployment small. No hidden agent orchestration.",
  ],
  [
    "07",
    "Name the unfinished work",
    "Authentication, tenant isolation, distributed limits, recovery drills and load testing remain prerequisites for customer data.",
  ],
];
function SectionTitle({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="review-section-title">
      <p className="review-kicker">{number} / ENGINEERING NOTES</p>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
function DecisionFlow() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const example = examples[selected];
  return (
    <div className="review-flow">
      <div
        className="review-tabs"
        role="tablist"
        aria-label="Decision examples"
      >
        {examples.map((item, index) => (
          <button
            key={item.title}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`flow-tab-${index}`}
            role="tab"
            aria-selected={selected === index}
            aria-controls="flow-panel"
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = selected;
              if (event.key === "ArrowRight")
                next = (selected + 1) % examples.length;
              else if (event.key === "ArrowLeft")
                next = (selected + examples.length - 1) % examples.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = examples.length - 1;
              else return;
              event.preventDefault();
              setSelected(next);
              tabs.current[next]?.focus();
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div
        className="review-flow-panel"
        role="tabpanel"
        id="flow-panel"
        aria-labelledby={`flow-tab-${selected}`}
        tabIndex={0}
      >
        <p className="review-caption">
          Fixture illustration · as of 15 October 2026 · no live execution
        </p>
        <div className="review-flow-heading">
          <h3>{example.pair}</h3>
          <span className={`review-status review-status-${selected}`}>
            {example.status}
          </span>
        </div>
        <ol className="review-trace">
          <li>
            <b>Select the pair</b>
            <span>
              {example.pair}. Opportunity and partner fields define the input.
            </span>
          </li>
          <li>
            <b>Retrieve evidence</b>
            <span>
              Load source metadata from the opportunity. Presence does not imply
              verification.
            </span>
          </li>
          <li>
            <b>Apply hard rules</b>
            <span>{example.rule}</span>
          </li>
          <li>
            <b>Calculate the weighted score</b>
            <span>
              Mandate, maturity, evidence coverage and freshness. Optional
              compatible vectors add semantic relevance; none can override a
              failed rule.
            </span>
          </li>
          <li>
            <b>Produce a decision trace</b>
            <span>{example.detail}</span>
          </li>
          <li>
            <b>Select an explanation, if available</b>
            <span>
              Cloudflare selects IDs from approved statements and evidence
              references. The server validates and renders the text.
            </span>
          </li>
          <li>
            <b>Fall back deterministically</b>
            <span>
              If inference is unavailable or invalid, return the deterministic
              statements with an explicit fallback mode. No eligibility change.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
export default function Review() {
  const [active, setActive] = useState("overview");
  const [capital, setCapital] = useState<8 | 25>(8);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "AETHER — Engineering Case Study";
    document.documentElement.classList.add("review-document");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => {
      observer.disconnect();
      document.title = previousTitle;
      document.documentElement.classList.remove("review-document");
    };
  }, []);
  return (
    <div className="review-page">
      <a className="review-skip" href="#review-content">
        Skip to case study
      </a>
      <header className="review-header">
        <a href="/" className="review-brand">
          Λ{" "}
          <span>
            AETHER<small>ENGINEERING REVIEW</small>
          </span>
        </a>
        <a href="/" className="review-open">
          Open application <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>
      <div className="review-layout">
        <nav className="review-nav" aria-label="Case study sections">
          <p>INSIDE THE BUILD</p>
          {sections.map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setActive(id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
          <a className="review-source" href={repository}>
            Source on GitHub <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
        <main id="review-content" className="review-content" tabIndex={-1}>
          <section id="overview" className="review-hero">
            <p className="review-kicker">ENGINEERING CASE STUDY</p>
            <h1>
              AETHER
              <span>
                Commercial Intelligence
                <br />
                &amp; Trust OS
              </span>
            </h1>
            <p className="review-disclosure">
              Independent technical proof of concept · Synthetic demonstration
              data
            </p>
            <p className="review-intro">
              Clean-energy commercialization depends on more than a promising
              match. AETHER makes the path from opportunity to partner decision
              inspectable: hard mandate checks establish eligibility, explicit
              weights explain ranking, and source records expose uncertainty.
              This independently developed, production-deployed proof of concept
              combines a deterministic Python core with a responsive React
              workspace and optional AI-assisted explanations. It demonstrates
              how to build useful decision support while keeping model output,
              evidence quality and human judgment in their proper roles.
            </p>
            <div className="review-actions">
              <a className="review-button" href="/">
                Open Live Application{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a
                className="review-button review-secondary"
                href="#architecture"
              >
                Explore Architecture <ArrowDown size={16} aria-hidden="true" />
              </a>
              <a href={repository}>View GitHub ↗</a>
            </div>

            <div className="review-principles">
              <div>
                <strong>Rules decide.</strong>
                <span>Deterministic authority</span>
              </div>
              <div>
                <strong>Evidence informs.</strong>
                <span>Visible provenance &amp; uncertainty</span>
              </div>
              <div>
                <strong>Humans review.</strong>
                <span>No automated investment approval</span>
              </div>
            </div>
          </section>
          <section id="capabilities">
            <SectionTitle
              number="02"
              title="Useful decisions. Visible boundaries."
            >
              Four capabilities built around an inspectable decision, not an
              opaque recommendation.
            </SectionTitle>
            <div className="review-grid">
              {[
                [
                  GitBranch,
                  "Deterministic partner matching",
                  "Sector, stage, geography, capital, TRL and buyer integration checks separate eligible, rejected and review-required pairs. A high score never overrides a failed gate.",
                ],
                [
                  ShieldCheck,
                  "Evidence provenance and trust",
                  "Inspect source labels, dates, freshness, missing factors and contradictions. Verification labels are fictional metadata, not independent substantiation.",
                ],
                [
                  Layers3,
                  "AI-assisted decision explanations",
                  "Cloudflare selects approved statement IDs. Strict validation and server rendering keep model-generated claims out of the decision.",
                ],
                [
                  FlaskConical,
                  "Scenario simulation",
                  "Change assumptions and compare eligibility with the baseline. Calculations use in-memory copies; original records stay unchanged.",
                ],
              ].map(([Icon, title, text]) => {
                const Symbol = Icon as typeof GitBranch;
                return (
                  <article className="review-card" key={String(title)}>
                    <Symbol size={23} aria-hidden="true" />
                    <h3>{String(title)}</h3>
                    <p>{String(text)}</p>
                  </article>
                );
              })}
            </div>
          </section>
          <section id="architecture">
            <SectionTitle
              number="03"
              title="A small system with clear authority."
            >
              The backend coordinates storage, deterministic logic and optional
              inference. These are separate responsibilities, not an autonomous
              agent chain.
            </SectionTitle>
            <div
              className="review-architecture"
              role="group"
              aria-label="System architecture"
            >
              <div className="review-node review-client">
                <small>PUBLIC PRESENTATION · RENDER STATIC</small>
                <h3>Browser / React + TypeScript</h3>
                <p>
                  Workspace, evidence dialogs, scenarios and explanation display
                </p>
              </div>
              <p className="review-connector">
                ↓ HTTPS JSON · requests and responses
              </p>
              <div className="review-node review-api">
                <small>SERVER BOUNDARY · RENDER PYTHON SERVICE</small>
                <h3>FastAPI backend</h3>
                <p>
                  Validates inputs, reads records and orchestrates the decision
                </p>
              </div>
              <p className="review-connector">
                ↓ Backend calls these components
              </p>
              <div className="review-system-grid">
                <div className="review-node">
                  <small>DECISION AUTHORITY</small>
                  <h3>Deterministic matching</h3>
                  <p>
                    Hard rules → status
                    <br />
                    Weighted components → score
                    <br />
                    Trace → preapproved statements
                  </p>
                </div>
                <div className="review-node">
                  <small>STORED RECORDS · SUPABASE</small>
                  <h3>PostgreSQL + pgvector</h3>
                  <p>
                    JSONB payloads contain evidence. Optional vectors support
                    Python cosine similarity; structured matching works without
                    them.
                  </p>
                </div>
                <div className="review-node review-ai">
                  <small>OPTIONAL EXPLANATION ADAPTER</small>
                  <h3>Cloudflare Workers AI</h3>
                  <p>
                    Backend sends allowed statements and IDs. Model selects;
                    backend validates. No eligibility or scoring authority.
                  </p>
                </div>
              </div>
              <div className="review-human">
                <ShieldCheck size={20} aria-hidden="true" />
                <p>
                  <b>Human review is a boundary, not an automated approval.</b>{" "}
                  Review status is metadata; no persisted review workflow
                  exists.
                </p>
              </div>
            </div>
            <p className="review-caption">
              Without DATABASE_URL, the repository uses canonical fixtures. A
              configured database failure returns an error; it does not silently
              substitute fixtures. pgvector is storage here, not an approximate
              search service.
            </p>
            <a href={documentLink("ARCHITECTURE")}>
              Read the implemented architecture ↗
            </a>
          </section>
          <section id="decision-flow">
            <SectionTitle
              number="04"
              title="Follow the decision, including the failure paths."
            >
              Explore four explicitly illustrated paths through the same
              deterministic core. These tabs do not call the backend or simulate
              live execution.
            </SectionTitle>
            <DecisionFlow />
          </section>
          <section id="evidence">
            <SectionTitle
              number="05"
              title="A citation is a starting point, not proof."
            >
              Separate mandate compatibility, ranking and evidence support
              before interpreting an explanation.
            </SectionTitle>
            <div className="review-grid review-definitions">
              {[
                [
                  "Eligibility",
                  "Hard-rule status: eligible, rejected or review. Not an approval.",
                ],
                [
                  "Weighted score",
                  "A heuristic ranking index. Not a probability of success.",
                ],
                [
                  "Completeness / readiness",
                  "Factor coverage versus a separate support index reflecting freshness, verification and conflict.",
                ],
                [
                  "AI explanation",
                  "A selection of preapproved statements. Adds no new evidence or verification.",
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <article className="review-evidence">
              <div>
                <p className="review-kicker">REPRESENTATIVE FIXTURE RECORD</p>
                <h3>volt-e0 / technology</h3>
                <p>Technology assessment recorded; human diligence required</p>
                <span className="review-status review-status-2">
                  Unverified · conflict flagged
                </span>
              </div>
              <dl>
                {[
                  ["Source", "VoltWeave / fictional dossier §1"],
                  ["Source type", "Synthetic diligence record"],
                  ["Observed", "01-12-2025"],
                  ["Last verified", "Not recorded"],
                  ["Freshness", "Stale · 318 days as of 15-10-2026"],
                  [
                    "Contradiction",
                    "Different values exist for the technology factor",
                  ],
                  ["Human review", "Pending"],
                  ["Confidence", "Unknown; not independently substantiated"],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="review-caption">
                All records are synthetic. Even a fixture record labeled
                “verified” is fictional, not independently verified. Freshness
                uses the last verified or observed date and a 0–180 day window.
                Conflict detection compares same-factor value strings; it does
                not resolve truth.
              </p>
            </article>
            <a href="/?view=evidence">
              Open Evidence &amp; Trust in the application ↗
            </a>
          </section>
          <section id="scenario">
            <SectionTitle
              number="06"
              title="One assumption. A different eligibility outcome."
            >
              Recorded VoltWeave example from the 15 October 2026 smoke test.
              Toggle the displayed capital requirement; this is not a live
              recalculation.
            </SectionTitle>
            <div className="review-scenario">
              <div>
                <p className="review-kicker">CAPITAL REQUIREMENT / USD</p>
                <div className="review-capital">
                  ${capital}
                  <span>M</span>
                </div>
                <div
                  className="review-toggle"
                  role="group"
                  aria-label="Recorded capital scenario"
                >
                  {([8, 25] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={capital === value}
                      onClick={() => setCapital(value)}
                    >
                      ${value}M
                    </button>
                  ))}
                </div>
              </div>
              <div aria-live="polite" aria-atomic="true">
                <h3>Northstar Climate &amp; Atlas Industrial</h3>
                <p className="review-scenario-result">
                  {capital === 8 ? "Eligible at $8M" : "Rejected at $25M"}
                </p>
                <p>
                  {capital === 8
                    ? "The original capital requirement passes both partner ranges."
                    : "The increased requirement fails both capital-range checks."}
                </p>
                <p>
                  <b>Recorded score delta: 0.</b> Capital is a hard gate, not a
                  weighted score component. No interpolated score is shown.
                </p>
              </div>
            </div>
          </section>
          <section id="boundaries">
            <SectionTitle
              number="07"
              title="Trust comes from limits you can inspect."
            >
              A public demonstration is not an enterprise security boundary.
            </SectionTitle>
            <div className="review-grid">
              <article className="review-card">
                <h3>Enforced in application code</h3>
                <ul>
                  <li>Deterministic eligibility and scoring authority.</li>
                  <li>
                    Strict AI selection schema, known IDs and mandatory
                    eligibility statement.
                  </li>
                  <li>
                    Server-rendered statements; no model-authored decision
                    claims.
                  </li>
                  <li>No public endpoint persists scenario changes.</li>
                </ul>
              </article>
              <article className="review-card review-caution">
                <h3>Not a customer-data environment</h3>
                <ul>
                  <li>No authentication, authorization or tenant isolation.</li>
                  <li>
                    All valid table records are publicly served and labeled
                    synthetic.
                  </li>
                  <li>
                    RLS without public policies does not prevent owner-role
                    bypass.
                  </li>
                  <li>
                    Server-side credentials are configured through environment
                    variables; deployed access and rotation were not audited.
                  </li>
                </ul>
              </article>
            </div>
            <p className="review-note">
              Known operational risks: synchronous reads in the async
              explanation route can block the worker; runtime reads set no query
              timeout. AI limits are process-local and reset on restart. No
              distributed abuse controls, verified backup recovery or measured
              capacity guarantee.
            </p>
          </section>
          <section id="verification">
            <SectionTitle
              number="08"
              title="Evidence of behavior. Not a promise of uptime."
            >
              Different checks answer different questions. Production
              observations below are dated, scoped and separate from local
              regression tests.
            </SectionTitle>
            <div className="review-checks">
              {[
                [
                  "Unit tests",
                  "Domain, API and AI parser/fallback tests; React interaction and date tests. Run locally with pytest and Vitest. Mocked inference is not provider connectivity.",
                ],
                [
                  "Browser end-to-end",
                  "Real Chromium desktop/mobile tests cover workflows, keyboard dialogs, reduced motion and automated accessibility. No claim of manual screen-reader or physical-device certification.",
                ],
                [
                  "CI configuration",
                  "GitHub Actions defines Ruff, pytest, isolated PostgreSQL seed verification, frontend lint/typecheck/build and Chromium tests. Configuration alone is not a passing run.",
                ],
                [
                  "Production smoke · 15 October 2026",
                  "6 opportunities / 4 partners. CarbonArc → Northstar rejected at 28.7/100. Cloudflare explanation HTTP 200, correct citation, Escape/focus restoration, scenario eligibility changes and mobile checks. 14 observed responses were HTTP 200.",
                ],
                [
                  "Still unverified operationally",
                  "Load capacity, backup restoration, failover, tenant isolation and ongoing availability. The smoke test did not establish a deployed commit identity.",
                ],
              ].map(([title, text]) => (
                <article key={title}>
                  <FileText size={18} aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="review-caption">
              The synthetic-v1 benchmark has 24 labeled pairs. At fixture date
              14 October 2026 and K=2 it returns nine valid pairs with zero
              hard-rule violations. This is a fixed regression fixture, not
              real-market accuracy.
            </p>
            <a href={documentLink("PRODUCTION_READINESS")}>
              Read the dated verification record ↗
            </a>{" "}
            · <a href={documentLink("EVALUATION")}>Evaluation methodology ↗</a>
          </section>
          <section id="decisions">
            <SectionTitle
              number="09"
              title="The engineering is in the trade-offs."
            >
              Deliberate constraints make this small system easier to reason
              about and honest about what comes next.
            </SectionTitle>
            <div className="review-decision-grid">
              {decisions.map(([number, title, text]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <a href={documentLink("ENGINEERING_DECISIONS")}>
              Explore the full engineering decisions ↗
            </a>
          </section>
          <section id="readiness">
            <SectionTitle
              number="10"
              title="Deployed as a POC. Scoped as a POC."
            >
              React static assets and the FastAPI service are hosted on Render.
              Supabase provides PostgreSQL; Cloudflare provides optional
              inference.
            </SectionTitle>
            <div className="review-readiness">
              <div>
                <small>WORKING PROTOTYPE</small>
                <h3>Inspectable end to end</h3>
                <p>
                  Matching, evidence, scenario exploration and deterministic
                  fallback. The retained smoke report observed a successful
                  Cloudflare explanation.
                </p>
              </div>
              <div>
                <small>BEFORE REAL CUSTOMERS</small>
                <h3>Build the operating boundary</h3>
                <p>
                  Identity and tenant authorization, licensed ingestion, audit
                  trails, independent verification, durable quotas, monitoring,
                  restore drills and representative load tests.
                </p>
              </div>
            </div>
            <p className="review-caption">
              Render configuration selects one Python worker and a liveness-only
              health check. Provider quotas, pricing, backups and availability
              are not guaranteed by the repository.
            </p>
          </section>
          <section className="review-closing">
            <p className="review-kicker">FROM REVIEW TO EXPLORATION</p>
            <h2>Explore the working prototype.</h2>
            <div className="review-actions">
              <a className="review-button" href="/">
                Launch AETHER <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <a href={repository}>View GitHub ↗</a>
              <a href={documentLink("ARCHITECTURE")}>Read Architecture ↗</a>
            </div>
            <p>
              Independent technical proof of concept. All opportunity, partner
              and evidence records are synthetic. No affiliation with Energytech
              Cypher or Jason Ethier is claimed.
            </p>
          </section>
          <footer className="review-footer">
            AETHER / Commercial Intelligence &amp; Trust OS{" "}
            <span>Independent engineering · MIT licensed</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
