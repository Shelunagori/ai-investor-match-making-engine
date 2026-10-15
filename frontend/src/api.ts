export type Evidence = {
  id: string;
  factor: string;
  value: string;
  source: string;
  source_type: string;
  observed: string;
  verified: string | null;
  status: string;
  human_review: string;
  confidence: string;
  age_days: number;
  fresh: boolean;
  contradiction: boolean;
};
export type Trust = {
  records: Evidence[];
  coverage: number;
  missing: string[];
  freshness: number;
  review_count: number;
};
export type Readiness = {
  score: number;
  factors: { factor: string; score: number | null; reason: string }[];
  methodology: string;
};
export type Opportunity = {
  id: string;
  name: string;
  sector: string;
  description: string;
  stage: string;
  geography: string;
  capital: number;
  trl: number | null;
  integration: number | null;
  pipeline: string;
  trust: Trust;
  readiness: Readiness;
  eligible_count: number;
};
export type Partner = {
  id: string;
  name: string;
  kind: string;
  sectors: string[];
  stages: string[];
  geographies: string[];
  min_capital: number;
  max_capital: number;
  min_trl: number;
  max_integration: number;
  thesis: string;
};
export type Match = {
  partner: Partner;
  status: string;
  score: number;
  checks: { rule: string; result: string }[];
  components: {
    name: string;
    weight: number;
    value: number;
    contribution: number;
  }[];
  reasons: string[];
  semantic: string;
  evidence_ids: string[];
  trace: string[];
};
export type Dashboard = {
  as_of: string;
  synthetic: boolean;
  opportunities: Opportunity[];
  partners: Partner[];
  metrics: {
    opportunities: number;
    capital: number;
    eligible_matches: number;
    reviews: number;
    evidence_coverage: number;
  };
};
export type Detail = {
  opportunity: Omit<Opportunity, "trust" | "readiness" | "eligible_count">;
  matches: Match[];
  trust: Trust;
  readiness: Readiness;
};
export type ScenarioResult = {
  baseline: Match[];
  simulated: Match[];
  changes: {
    partner: string;
    before: string;
    after: string;
    score_delta: number;
    reasons: string[];
  }[];
  notice: string;
};
export type Evaluation = {
  version: string;
  as_of: string;
  k: number;
  metrics: Record<string, number | null>;
  denominators: Record<string, number>;
  cases: {
    opportunity: string;
    partner: string;
    label: string;
    actual: string;
    passed: boolean;
  }[];
  regression: { baseline: string; failures: number };
  limitations: string;
};
export type Explanation = {
  mode: string;
  reason: string;
  statements: string[];
  evidence_ids: string[];
  status: string;
};
const base = import.meta.env.VITE_API_URL || "";
export async function api<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(25000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 503
        ? "Data service unavailable. Check configuration or try again after the service wakes."
        : `Request failed (${response.status}). Please try again.`,
    );
  return response.json();
}
