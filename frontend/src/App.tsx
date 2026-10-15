import { useEffect, useState } from "react";
import { formatDate } from "./date";
import { Loading } from "./Loading";
import {
  Badge,
  EvidenceRecord,
  EvidenceReferences,
  ExplanationPanel,
  RuleCheck,
} from "./Trust";
export { Badge } from "./Trust";
import {
  ArrowUpRight,
  ArrowRight,
  Layers3,
  ShieldCheck,
  FlaskConical,
  ChartNoAxesCombined,
  Compass,
  Search,
  ChevronRight,
  Zap,
  Activity,
  X,
  RefreshCw,
  Play,
  Menu,
} from "lucide-react";
import { motion, MotionConfig } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  api,
  type Dashboard,
  type Detail,
  type Opportunity,
  type Match,
  type Evaluation,
  type ScenarioResult,
  type Explanation,
} from "./api";

type Page =
  | "Overview"
  | "Opportunities"
  | "Evidence & trust"
  | "Scenario lab"
  | "Evaluation studio";
const nav = [
  { name: "Overview" as Page, icon: Compass },
  { name: "Opportunities" as Page, icon: Layers3 },
  { name: "Evidence & trust" as Page, icon: ShieldCheck },
  { name: "Scenario lab" as Page, icon: FlaskConical },
  { name: "Evaluation studio" as Page, icon: ChartNoAxesCombined },
];
const sectorIcons: Record<string, string> = {
  "Battery storage": "↯",
  Hydrogen: "H₂",
  Geothermal: "◎",
  "Industrial heat": "♨",
  "Grid modernization": "⌁",
  "Carbon management": "C",
};
function Meter({ value }: { value: number }) {
  return (
    <div
      className="meter"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label="Evidence completeness"
    >
      <i style={{ width: `${value}%` }} />
    </div>
  );
}
function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error" role="alert">
      <strong>Unable to complete request</strong>
      <p>{message}</p>
      {retry && (
        <button onClick={retry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("Overview"),
    [data, setData] = useState<Dashboard | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [selected, setSelected] = useState("volt"),
    [query, setQuery] = useState(""),
    [sector, setSector] = useState("All sectors"),
    [tour, setTour] = useState(-1),
    [mobile, setMobile] = useState(false);
  useEffect(() => {
    let active = true;
    setError("");
    api<Dashboard>("/api/dashboard")
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const open = (id: string, next: Page = "Opportunities") => {
    setSelected(id);
    setPage(next);
  };
  const journey = [
    {
      page: "Overview" as Page,
      title: "Your commercialization command center",
      text: "Six fictional innovators. Every metric comes from their records. Start with the pipeline and the evidence that needs review.",
    },
    {
      page: "Opportunities" as Page,
      title: "Inspect the decision, not just the score",
      text: "VoltWeave fits two mandates. Expand the decision trace to see hard rules, weighted components and explicit rejection reasons.",
    },
    {
      page: "Evidence & trust" as Page,
      title: "Find what is missing or contradictory",
      text: "The technology reports conflict. Provenance and timestamps make that visible; a human still needs to resolve it.",
    },
    {
      page: "Scenario lab" as Page,
      title: "Change the conditions",
      text: "Move VoltWeave to India or lower its TRL. Run the simulation and compare eligibility without changing the original.",
    },
    {
      page: "Evaluation studio" as Page,
      title: "Measure behavior before trusting it",
      text: "Inspect all 24 labeled cases. Perfect results on this tiny synthetic set are regression evidence, not real-world accuracy.",
    },
  ];
  function step(n: number) {
    setMobile(false);
    setTour(n);
    if (n < journey.length) {
      setPage(journey[n].page);
      setSelected("volt");
    } else setTour(-1);
  }
  const filtered =
    data?.opportunities.filter(
      (o) =>
        (sector === "All sectors" || o.sector === sector) &&
        `${o.name} ${o.sector}`.toLowerCase().includes(query.toLowerCase()),
    ) ?? [];
  return (
    <MotionConfig reducedMotion="user">
      <div className="shell">
        <a className="skip" href="#main">
          Skip to content
        </a>
        <aside className={mobile ? "sidebar expanded" : "sidebar"}>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage("Overview");
            }}
          >
            <span className="brand-mark">Λ</span>AETHER
            <span className="brand-dot">OS</span>
          </a>
          <div className="workspace">
            <span className="workspace-icon">A</span>
            <div>
              Intelligence workspace<small>Commercialization / Demo</small>
            </div>
          </div>
          <p className="nav-label">WORKSPACE</p>
          <nav aria-label="Main navigation">
            {nav.map(({ name, icon: Icon }) => (
              <button
                key={name}
                className={page === name ? "active" : ""}
                aria-current={page === name ? "page" : undefined}
                onClick={() => {
                  setPage(name);
                  setMobile(false);
                }}
              >
                <Icon size={18} />
                {name}
                {page === name && <span className="nav-dot" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="live-dot" /> DETERMINISTIC CORE
            <p>
              Built for decisions.
              <br />
              Grounded in evidence.
            </p>
            <small>Fictional companies. Real logic.</small>
          </div>
          <button className="profile" onClick={() => step(0)}>
            <span>DN</span>
            <div>
              Demo workspace
              <small>
                Take the guided tour <ArrowUpRight size={12} />
              </small>
            </div>
          </button>
        </aside>
        <div className="content">
          <header className="topbar">
            <button
              className="mobile-menu icon-button"
              aria-label="Toggle navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              Workspace <ChevronRight size={14} /> <strong>{page}</strong>
            </div>
            <span className="demo-pill">
              <span className="live-dot" /> SYNTHETIC DEMO
            </span>
            <button className="top-tour" onClick={() => step(0)}>
              <Play size={14} /> Guided tour
            </button>
          </header>
          <main id="main">
            {tour >= 0 && (
              <div className="tour" role="region" aria-label="Guided demo">
                <div>
                  <small>GUIDED JOURNEY · {tour + 1} / 5</small>
                  <h3>{journey[tour].title}</h3>
                  <p>{journey[tour].text}</p>
                </div>
                <button onClick={() => step(tour + 1)}>
                  {tour === 4 ? "Finish" : "Next"} <ArrowRight size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Close guided tour"
                  onClick={() => setTour(-1)}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {error ? (
              <ErrorBox message={error} retry={() => setReload((v) => v + 1)} />
            ) : !data ? (
              <Loading dashboard label="Loading intelligence workspace…" />
            ) : (
              <>
                {page === "Overview" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="page-heading">
                      <div>
                        <p className="eyebrow">
                          COMMERCIAL INTELLIGENCE & TRUST OS
                        </p>
                        <h1>
                          From matches to <em>decisions.</em>
                        </h1>
                        <p>
                          A clearer path from breakthrough technology to
                          commercial reality.
                        </p>
                      </div>
                      <span className="date-label">
                        AS OF
                        <br />
                        <strong>{formatDate(data.as_of)}</strong>
                      </span>
                    </div>
                    <section className="hero">
                      <div className="hero-copy">
                        <span className="hero-overline">
                          <span className="live-dot" /> YOUR NEXT MOVE,
                          EXPLAINED
                        </span>
                        <h2>
                          Potential is everywhere.
                          <br />
                          Conviction needs evidence.
                        </h2>
                        <p>
                          Discover aligned partners, surface the unknowns, and
                          stress-test the path to deployment.
                        </p>
                        <button
                          className="primary"
                          onClick={() => open("volt")}
                        >
                          Explore the opportunity pipeline{" "}
                          <ArrowUpRight size={17} />
                        </button>
                        <small>
                          <ShieldCheck size={14} /> Explainable by design. Human
                          judgment at the center.
                        </small>
                      </div>
                      <div className="orbit" aria-hidden="true">
                        <div className="orbit-ring r1" />
                        <div className="orbit-ring r2" />
                        <div className="orbit-ring r3" />
                        <div className="orbit-center">
                          Λ<span>AETHER</span>
                        </div>
                        <div className="orbit-label l1">
                          <span>01</span> Opportunity
                        </div>
                        <div className="orbit-label l2">
                          <span>02</span> Evidence
                        </div>
                        <div className="orbit-label l3">
                          <span>03</span> Decision
                        </div>
                        <i className="orb-point p1" />
                        <i className="orb-point p2" />
                      </div>
                    </section>
                    <section className="metrics" aria-label="Pipeline metrics">
                      {[
                        {
                          label: "Active opportunities",
                          value: data.metrics.opportunities,
                          note: "Across six energy verticals",
                          icon: Layers3,
                        },
                        {
                          label: "Capital sought",
                          value: `$${data.metrics.capital}M`,
                          note: "Fictional pipeline · USD",
                          icon: Activity,
                        },
                        {
                          label: "Eligible partnerships",
                          value: data.metrics.eligible_matches,
                          note: "Passed every hard rule",
                          icon: Zap,
                        },
                        {
                          label: "Evidence completeness",
                          value: `${data.metrics.evidence_coverage}%`,
                          note: `${data.metrics.reviews} records need review`,
                          icon: ShieldCheck,
                        },
                      ].map((m) => (
                        <div className="metric" key={m.label}>
                          <div>
                            {m.label}
                            <m.icon size={17} />
                          </div>
                          <strong>{m.value}</strong>
                          <small>{m.note}</small>
                        </div>
                      ))}
                    </section>
                    <div className="overview-grid">
                      <section className="panel">
                        <div className="section-heading">
                          <div>
                            <p className="eyebrow">
                              DISCOVER → VALIDATE → DEPLOY
                            </p>
                            <h2>Opportunity pipeline</h2>
                          </div>
                          <button
                            className="text-button"
                            onClick={() => setPage("Opportunities")}
                          >
                            View all <ArrowRight size={15} />
                          </button>
                        </div>
                        <div
                          className="table-wrap"
                          tabIndex={0}
                          role="region"
                          aria-label="Scrollable data table"
                        >
                          <table>
                            <thead>
                              <tr>
                                <th>Innovator / sector</th>
                                <th>Stage</th>
                                <th>Evidence</th>
                                <th>Matches</th>
                                <th>
                                  <span className="sr-only">Open</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.opportunities.map((o) => (
                                <tr key={o.id}>
                                  <td>
                                    <button
                                      className="company-link"
                                      onClick={() => open(o.id)}
                                    >
                                      <span className="sector-icon">
                                        {sectorIcons[o.sector]}
                                      </span>
                                      <span>
                                        <strong>{o.name}</strong>
                                        <small>{o.sector}</small>
                                      </span>
                                    </button>
                                  </td>
                                  <td>
                                    <Badge status={o.pipeline} />
                                  </td>
                                  <td>
                                    <div className="evidence-cell">
                                      <span>{o.trust.coverage}%</span>
                                      <Meter value={o.trust.coverage} />
                                    </div>
                                  </td>
                                  <td>
                                    <span className="match-count">
                                      {o.eligible_count
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      className="icon-button"
                                      aria-label={`Inspect ${o.name}`}
                                      onClick={() => open(o.id)}
                                    >
                                      <ArrowUpRight size={17} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                      <aside className="right-stack">
                        <section className="review-panel">
                          <div className="section-heading">
                            <h2>On your radar</h2>
                            <span className="copper-dot" />
                          </div>
                          <p className="muted">
                            The questions worth asking next.
                          </p>
                          <button
                            className="radar-item"
                            onClick={() => open("volt", "Evidence & trust")}
                          >
                            <span className="radar-number">01</span>
                            <div>
                              <Badge status="Conflicting evidence" />
                              <h3>One technology. Two stories.</h3>
                              <p>
                                VoltWeave’s maturity reports disagree. Review
                                both sources.
                              </p>
                              <span className="inline-link">
                                Inspect evidence <ArrowRight size={14} />
                              </span>
                            </div>
                          </button>
                          <button
                            className="radar-item"
                            onClick={() => open("carbon")}
                          >
                            <span className="radar-number">02</span>
                            <div>
                              <Badge status="Unknown criteria" />
                              <h3>Close the information gap.</h3>
                              <p>
                                CarbonArc’s stage and maturity are unknown.
                                Eligibility needs review.
                              </p>
                              <span className="inline-link">
                                View decision trace <ArrowRight size={14} />
                              </span>
                            </div>
                          </button>
                        </section>
                        <button
                          className="scenario-promo"
                          onClick={() => open("volt", "Scenario lab")}
                        >
                          <FlaskConical size={23} />
                          <div>
                            <h3>What if the conditions change?</h3>
                            <p>Test your assumptions in Scenario Lab.</p>
                            <span>
                              Run a scenario <ArrowUpRight size={15} />
                            </span>
                          </div>
                        </button>
                      </aside>
                    </div>
                    <section className="panel chart-panel">
                      <div>
                        <p className="eyebrow">EVIDENCE-SUPPORTED READINESS</p>
                        <h2>See where diligence can move the needle.</h2>
                        <p className="muted">
                          A transparent heuristic, not certification. Missing
                          factors contribute zero.
                        </p>
                      </div>
                      <div className="chart">
                        <ResponsiveContainer width="100%" height={190}>
                          <BarChart
                            data={data.opportunities.map((o) => ({
                              name: o.name,
                              readiness: o.readiness.score,
                            }))}
                          >
                            <CartesianGrid vertical={false} stroke="#e5e5df" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip cursor={{ fill: "#e8ede8" }} />
                            <Bar
                              dataKey="readiness"
                              fill="#168477"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={32}
                              isAnimationActive={false}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </section>
                  </motion.div>
                )}
                {page === "Opportunities" && (
                  <>
                    <PageHeading
                      eyebrow="OPPORTUNITY INTELLIGENCE"
                      title="The right fit. With the reasons."
                      subtitle="Explore innovators and inspect every decision component."
                    />
                    <div className="filters">
                      <label className="search">
                        <Search size={17} />
                        <input
                          aria-label="Search opportunities"
                          placeholder="Search innovators or sectors"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <select
                        aria-label="Filter by sector"
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                      >
                        <option>All sectors</option>
                        {data.opportunities.map((o) => (
                          <option key={o.id}>{o.sector}</option>
                        ))}
                      </select>
                    </div>
                    <div className="opportunity-tabs">
                      {filtered.map((o) => (
                        <button
                          key={o.id}
                          className={selected === o.id ? "selected" : ""}
                          onClick={() => setSelected(o.id)}
                        >
                          <span>{sectorIcons[o.sector]}</span>
                          {o.name}
                        </button>
                      ))}
                    </div>
                    {filtered.length === 0 ? (
                      <div className="empty">
                        No opportunities match these filters.
                        <button
                          onClick={() => {
                            setQuery("");
                            setSector("All sectors");
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <OpportunityDetail
                        key={
                          filtered.some((o) => o.id === selected)
                            ? selected
                            : filtered[0].id
                        }
                        id={
                          filtered.some((o) => o.id === selected)
                            ? selected
                            : filtered[0].id
                        }
                        onEvidence={() => setPage("Evidence & trust")}
                        onScenario={() => setPage("Scenario lab")}
                      />
                    )}
                    <section className="partner-section">
                      <h2>Partner mandates</h2>
                      <div className="partner-grid">
                        {data.partners.map((p) => (
                          <article className="panel partner" key={p.id}>
                            <Badge status={p.kind} />
                            <h3>{p.name}</h3>
                            <p>{p.thesis}</p>
                            <small>{p.geographies.join(" · ")}</small>
                            <p>
                              ${p.min_capital}–{p.max_capital}M · TRL ≥{" "}
                              {p.min_trl}
                            </p>
                            <details>
                              <summary>View full mandate</summary>
                              <p>{p.sectors.join(" / ")}</p>
                              <p>{p.stages.join(" / ")}</p>
                              <p>
                                Maximum integration complexity:{" "}
                                {p.max_integration}/5
                              </p>
                            </details>
                          </article>
                        ))}
                      </div>
                    </section>
                  </>
                )}
                {page === "Evidence & trust" && (
                  <>
                    <PageHeading
                      eyebrow="EVIDENCE & TRUST ENGINE"
                      title="Trust starts with a source."
                      subtitle="Trace claims, inspect freshness and surface disagreement before making a decision."
                    />
                    <Selector
                      data={data}
                      selected={selected}
                      setSelected={setSelected}
                    />
                    <EvidenceView key={selected} id={selected} />
                  </>
                )}
                {page === "Scenario lab" && (
                  <>
                    <PageHeading
                      eyebrow="SCENARIO LAB"
                      title="Change an assumption. See the impact."
                      subtitle="Recalculate eligibility against a hypothetical future. Your source records stay intact."
                    />
                    <Selector
                      data={data}
                      selected={selected}
                      setSelected={setSelected}
                    />
                    <ScenarioLab
                      key={selected}
                      opportunity={
                        data.opportunities.find((o) => o.id === selected)!
                      }
                    />
                  </>
                )}
                {page === "Evaluation studio" && <EvaluationStudio />}
                <footer>
                  <span>
                    AETHER <b> / </b> From Matches to Decisions.
                  </span>
                  <span>
                    Independent proof of concept · All companies and claims are
                    fictional.
                  </span>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}
function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="smaller">{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
function Selector({
  data,
  selected,
  setSelected,
}: {
  data: Dashboard;
  selected: string;
  setSelected: (v: string) => void;
}) {
  return (
    <label className="selector">
      <span>Innovator</span>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        {data.opportunities.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} · {o.sector}
          </option>
        ))}
      </select>
    </label>
  );
}
function useDetail(id: string) {
  const [detail, setDetail] = useState<Detail | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<Detail>(`/api/opportunities/${id}`)
      .then((d) => {
        if (active) setDetail(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return { detail, error };
}
function OpportunityDetail({
  id,
  onEvidence,
  onScenario,
}: {
  id: string;
  onEvidence: () => void;
  onScenario: () => void;
}) {
  const { detail, error } = useDetail(id);
  if (error) return <ErrorBox message={error} />;
  if (!detail) return <Loading label="Loading decision trace…" />;
  const o = detail.opportunity;
  return (
    <>
      <section className="detail-banner">
        <div>
          <p className="eyebrow">
            {o.sector} / {o.geography}
          </p>
          <h2>{o.name}</h2>
          <p>{o.description}</p>
          <div className="chips">
            <Badge status={o.stage} />
            <span>${o.capital}M sought</span>
            <span>TRL {o.trl ?? "unknown"}</span>
            <span>Integration {o.integration ?? "unknown"}/5</span>
          </div>
        </div>
        <div className="detail-actions">
          <button onClick={onEvidence}>
            <ShieldCheck size={16} /> Inspect evidence
          </button>
          <button className="primary" onClick={onScenario}>
            <FlaskConical size={16} /> Simulate changes
          </button>
        </div>
      </section>
      <div className="section-heading spaced">
        <h2>Partnership decisions</h2>
        <span className="muted">Ranking index / 100 · Not a probability</span>
      </div>
      <div className="decision-context">
        <span>
          Evidence completeness <strong>{detail.trust.coverage}%</strong>
        </span>
        <span>
          Fresh source records <strong>{detail.trust.freshness}%</strong>
        </span>
        <span>
          Conflict flags{" "}
          <strong>
            {detail.trust.records.filter((e) => e.contradiction).length} records
          </strong>
        </span>
        <span>
          Human review{" "}
          <strong>{detail.trust.review_count} records need review</strong>
        </span>
        <small>
          Coverage is not verification. All evidence is synthetic; human
          diligence is required.
        </small>
      </div>
      <div className="match-grid result-enter">
        {detail.matches.map((m) => (
          <MatchCard
            key={m.partner.id}
            match={m}
            oid={id}
            records={detail.trust.records}
          />
        ))}
      </div>
      <section className="panel readiness">
        <h2>Commercialization readiness · {detail.readiness.score}/100</h2>
        <p className="muted">{detail.readiness.methodology}</p>
        <div className="factor-grid">
          {detail.readiness.factors.map((f) => (
            <div key={f.factor}>
              <strong>{f.factor}</strong>
              <span>{f.score ?? "Unknown"}</span>
              <small>{f.reason}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function MatchCard({
  match: m,
  oid,
  records,
}: {
  match: Match;
  oid: string;
  records: Detail["trust"]["records"];
}) {
  const [explanation, setExplanation] = useState<Explanation | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function explain() {
    setBusy(true);
    setError("");
    try {
      setExplanation(
        await api<Explanation>(
          `/api/opportunities/${oid}/explain/${m.partner.id}`,
          {},
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel match-card">
      <div className="section-heading">
        <div className="decision-label">
          <small>Eligibility</small>
          <Badge status={m.status} />
        </div>
        <div className="decision-label score-label">
          <small>Weighted score</small>
          <span className="score">
            {m.score}
            <small>/100</small>
          </span>
        </div>
      </div>
      <small className="muted">{m.partner.kind}</small>
      <h3>{m.partner.name}</h3>
      <p>{m.partner.thesis}</p>
      <p className="rule-policy">
        Any failed rule means rejected. Unknown rules without failures require
        review. Integration is evaluated only for industrial buyers; evidence
        quality is assessed separately.
      </p>
      <div className="checks">
        {m.checks.map((c) => (
          <RuleCheck key={c.rule} {...c} />
        ))}
      </div>
      <details>
        <summary>Decision trace & score breakdown</summary>
        <ol>
          {m.trace.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        {m.components.map((c) => (
          <div className="score-row" key={c.name}>
            <span>
              {c.name} ({c.weight}%)
            </span>
            <b>{c.contribution}</b>
          </div>
        ))}
        <p className="muted">Semantic relevance: {m.semantic}</p>
        <EvidenceReferences ids={m.evidence_ids} records={records} />
      </details>
      <button
        className="text-button explain-button"
        onClick={explain}
        disabled={busy}
      >
        {busy ? "Preparing explanation…" : "Explain this decision"}{" "}
        <ArrowRight size={14} />
      </button>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {busy
          ? `Preparing explanation for ${m.partner.name}.`
          : error
            ? ""
            : explanation
              ? `Explanation ready. Navigate to the Explanation for ${m.partner.name} region to review the decision and supporting evidence.`
              : ""}
      </p>
      {error && <ErrorBox message={error} />}{" "}
      {(busy || explanation) && (
        <div
          className="explanation-slot"
          aria-busy={busy}
          tabIndex={0}
          role="region"
          aria-label={`Explanation for ${m.partner.name}`}
        >
          {busy && (
            <Loading
              compact
              announce={false}
              label="Preparing grounded explanation…"
            />
          )}
          {explanation && !busy && (
            <ExplanationPanel
              explanation={explanation}
              match={m}
              records={records}
            />
          )}
        </div>
      )}
    </article>
  );
}
function EvidenceView({ id }: { id: string }) {
  const { detail, error } = useDetail(id),
    [onlyReview, setOnlyReview] = useState(false);
  if (error) return <ErrorBox message={error} />;
  if (!detail) return <Loading label="Loading source records…" />;
  const t = detail.trust,
    rows = t.records.filter(
      (e) => !onlyReview || e.human_review === "pending" || e.contradiction,
    );
  return (
    <>
      <div className="trust-summary">
        <div>
          <strong>{t.coverage}%</strong>
          <span>Factor coverage</span>
        </div>
        <div>
          <strong>{t.freshness}%</strong>
          <span>Fresh source records</span>
        </div>
        <div>
          <strong>{t.review_count}</strong>
          <span>Need human review</span>
        </div>
      </div>
      <div className="notice">
        <ShieldCheck size={18} />
        <span>
          Missing factors: {t.missing.join(", ") || "none"}. Fresh = verified or
          observed within 180 days. Verification labels are fictional fixture
          values, not real verification.
        </span>
      </div>
      {t.missing.length > 0 && (
        <div className="missing-evidence-summary">
          <Badge status="Missing evidence" />
          <span>{t.missing.join(" · ")}</span>
        </div>
      )}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={onlyReview}
          onChange={(e) => setOnlyReview(e.target.checked)}
        />{" "}
        Show only records needing review
      </label>
      {t.records.some((e) => e.contradiction) && (
        <section className="conflict-notice">
          <h2>Compare flagged evidence</h2>
          <p>
            Inspect related records together. A conflict is not automatically
            resolved by AI.
          </p>
          <EvidenceReferences
            ids={t.records.filter((e) => e.contradiction).map((e) => e.id)}
            records={t.records}
          />
        </section>
      )}
      <div className="evidence-grid result-enter">
        {rows.map((e) => (
          <EvidenceRecord key={e.id} record={e} />
        ))}
      </div>
      {!rows.length && <p className="empty">No source records in this view.</p>}
    </>
  );
}
function ScenarioLab({ opportunity: o }: { opportunity: Opportunity }) {
  const [stage, setStage] = useState(o.stage),
    [geography, setGeography] = useState(o.geography),
    [capital, setCapital] = useState(o.capital),
    [trl, setTrl] = useState(o.trl ?? 5),
    [constraint, setConstraint] = useState(3),
    [result, setResult] = useState<ScenarioResult | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false);
  async function run() {
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<ScenarioResult>(`/api/opportunities/${o.id}/scenario`, {
          stage,
          geography,
          capital,
          trl,
          buyer_max_integration: constraint,
        }),
      );
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="scenario-layout">
      <section className="panel scenario-controls">
        <p className="eyebrow">HYPOTHETICAL INPUTS</p>
        <h2>{o.name}</h2>
        <p className="muted">
          Original: {o.stage} · {o.geography} · ${o.capital}M · TRL{" "}
          {o.trl ?? "unknown"}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          onChange={() => setDirty(true)}
        >
          <label>
            Funding stage
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              {["Seed", "Series A", "Series B", "Unknown"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Target geography
            <select
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
            >
              {["Europe", "North America", "India"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Capital requirement (USD millions)
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.1"
              required
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
            />
          </label>
          <label>
            Technology readiness <b>TRL {trl}</b>
            <input
              type="range"
              min="1"
              max="9"
              value={trl}
              onChange={(e) => setTrl(Number(e.target.value))}
            />
          </label>
          <label>
            Buyer’s maximum integration complexity <b>{constraint}/5</b>
            <input
              type="range"
              min="1"
              max="5"
              value={constraint}
              onChange={(e) => setConstraint(Number(e.target.value))}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Recalculating…" : "Run simulation"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
      <section className="panel scenario-results">
        <p className="eyebrow">BASELINE → HYPOTHETICAL</p>
        <h2>Decision impact</h2>
        {error && <ErrorBox message={error} />}{" "}
        {busy &&
          (result ? (
            <p role="status">Recalculating scenario impact…</p>
          ) : (
            <Loading compact label="Recalculating scenario impact…" />
          ))}
        {!result && !busy ? (
          <div className="scenario-empty">
            <FlaskConical size={44} />
            <h3>Every assumption has consequences.</h3>
            <p>
              Adjust the inputs and run a simulation to see which partnerships
              open up or fall away.
            </p>
          </div>
        ) : result ? (
          <div className="result-enter" key={JSON.stringify(result)}>
            <p className="notice">
              {dirty
                ? "Inputs changed. Run again to update these results."
                : result.notice}
            </p>
            {result.changes.map((c) => (
              <div className="scenario-change" key={c.partner}>
                <h3>{c.partner}</h3>
                <div>
                  <Badge status={c.before} />
                  <ArrowRight size={16} />
                  <Badge status={c.after} />
                  <span>
                    {c.score_delta >= 0 ? "+" : ""}
                    {c.score_delta} score
                  </span>
                </div>
                <p>
                  {c.reasons.length
                    ? `Requires attention: ${c.reasons.join(", ")}`
                    : "All hard criteria satisfied under these assumptions."}
                </p>
              </div>
            ))}
          </div>
        ) : null}
        <small className="muted">
          The buyer constraint applies to all industrial partners in this
          simulation. Existing evidence is not re-verified by a hypothetical
          change.
        </small>
      </section>
    </div>
  );
}
function EvaluationStudio() {
  const [data, setData] = useState<Evaluation | null>(null),
    [k, setK] = useState(2),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    setData(null);
    api<Evaluation>(`/api/evaluation?k=${k}`)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [k]);
  return (
    <>
      <PageHeading
        eyebrow="AI EVALUATION STUDIO"
        title="Trust is a testable property."
        subtitle="A labeled synthetic benchmark for recommendation quality, hard rules and unknowns."
      />
      <label className="selector">
        Recommendations per innovator (K)
        <select value={k} onChange={(e) => setK(Number(e.target.value))}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      {error ? (
        <ErrorBox message={error} />
      ) : !data ? (
        <Loading label="Running benchmark…" />
      ) : (
        <>
          <div className="metrics eval-metrics">
            {Object.entries(data.metrics).map(([key, value]) => (
              <div className="metric" key={key}>
                <div>{key.replaceAll("_", " ")}</div>
                <strong>
                  {value === null
                    ? "N/A"
                    : key === "unknown_handling"
                      ? `${value}/${data.denominators.ambiguous}`
                      : `${(value * 100).toFixed(1)}%`}
                </strong>
                <small>
                  {key === "unknown_handling"
                    ? "Ambiguous cases routed to review"
                    : "Computed from current benchmark"}
                </small>
              </div>
            ))}
          </div>
          <div className="notice">
            <ShieldCheck size={18} />
            <span>{data.limitations}</span>
          </div>
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  {data.version} · AS OF {formatDate(data.as_of)}
                </p>
                <h2>Regression results</h2>
              </div>
              <Badge status={`${data.regression.failures} failures`} />
            </div>
            <p className="muted">
              {data.denominators.returned} returned /{" "}
              {data.denominators.relevant} relevant · {data.denominators.cases}{" "}
              labeled pairs · {data.denominators.evidence} evidence records
            </p>
            <details className="metric-definitions">
              <summary>Metric definitions & denominators</summary>
              <p>
                Precision@K = valid returned / all returned. Recall@K = valid
                returned / all valid labels. Hard-rule violations = returned
                with a failed rule / all returned. Evidence coverage = mean
                fraction of six factors present per innovator. Freshness = fresh
                records / all evidence records. Unknown handling = ambiguous
                labels routed to review / ambiguous labels. Regression compares
                current statuses with the fixed labeled baseline.
              </p>
            </details>
            <div
              className="table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Scrollable data table"
            >
              <table>
                <thead>
                  <tr>
                    <th>Innovator</th>
                    <th>Partner</th>
                    <th>Expected label</th>
                    <th>Actual decision</th>
                    <th>Regression</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cases.map((c) => (
                    <tr key={c.opportunity + c.partner}>
                      <td>{c.opportunity}</td>
                      <td>{c.partner}</td>
                      <td>{c.label}</td>
                      <td>
                        <Badge status={c.actual} />
                      </td>
                      <td>{c.passed ? "Pass" : "Fail"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
