import { useEffect, useId, useRef, useState } from "react";
import { Check, X, CircleHelp } from "lucide-react";
import type { Evidence, Explanation, Match } from "./api";
import { formatDate } from "./date";

export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase().replaceAll(" ", "-")}`}>
      {status}
    </span>
  );
}

export function ruleMeaning(rule: string, result: string): string {
  if (result === "pass")
    return "This hard matching rule passed using the recorded opportunity fields.";
  if (result === "fail")
    return "The recorded opportunity field does not satisfy this partner’s hard matching rule.";
  const unknown: Record<string, string> = {
    "Funding stage":
      "The opportunity’s funding stage is recorded as Unknown; stage compatibility cannot be evaluated.",
    "Technology readiness":
      "The opportunity’s TRL is not recorded; the minimum technology-readiness rule cannot be evaluated.",
    "Integration constraint":
      "The opportunity’s integration complexity is not recorded; the industrial buyer’s limit cannot be evaluated.",
  };
  return (
    unknown[rule] ??
    "The rule outcome is unavailable. This does not establish whether supporting evidence is missing or verified."
  );
}

export function RuleCheck({ rule, result }: { rule: string; result: string }) {
  return (
    <div className="rule-check">
      <div className="rule-line">
        {result === "pass" ? (
          <Check size={14} aria-hidden="true" />
        ) : result === "fail" ? (
          <X size={14} aria-hidden="true" />
        ) : (
          <CircleHelp size={14} aria-hidden="true" />
        )}
        <span>{rule}</span>
        <b className={result}>{result}</b>
      </div>
      <small className={result === "unknown" ? "rule-meaning" : "sr-only"}>
        {ruleMeaning(rule, result)}
      </small>
    </div>
  );
}

export function EvidenceRecord({ record: e }: { record: Evidence }) {
  return (
    <article className="panel evidence-record" aria-label={`Evidence ${e.id}`}>
      <div className="section-heading">
        <span className="eyebrow">
          {e.id} · {e.factor}
        </span>
        <Badge
          status={
            e.contradiction
              ? "Conflicting evidence"
              : e.status === "unverified"
                ? "Unverified"
                : e.status
          }
        />
      </div>
      <div className="evidence-flags">
        {!e.fresh && (
          <Badge
            status={e.age_days < 0 ? "Outside freshness window" : "Stale"}
          />
        )}
        {e.human_review === "pending" && (
          <Badge status="Human review pending" />
        )}
      </div>
      <h3>{e.value}</h3>
      <p>{e.source}</p>
      <p className="synthetic-disclosure">
        Synthetic evidence · Verification labels are fictional fixture values,
        not independent verification.
      </p>
      <dl>
        <dt>Evidence factor</dt>
        <dd>{e.factor}</dd>
        <dt>Source type</dt>
        <dd>{e.source_type}</dd>
        <dt>Observed</dt>
        <dd>{formatDate(e.observed)}</dd>
        <dt>Last verified</dt>
        <dd>{e.verified ? formatDate(e.verified) : "Not recorded"}</dd>
        <dt>Verification status</dt>
        <dd>{e.status}</dd>
        <dt>Freshness</dt>
        <dd>
          {e.fresh
            ? "Fresh"
            : e.age_days < 0
              ? "Outside freshness window (future date)"
              : "Stale"}{" "}
          · {e.age_days} days
        </dd>
        <dt>Conflict status</dt>
        <dd>
          {e.contradiction
            ? "Flagged for human review; no resolution inferred"
            : "No conflict flagged in the current record"}
        </dd>
        <dt>Human review</dt>
        <dd>{e.human_review}</dd>
        <dt>Confidence</dt>
        <dd>{e.confidence}</dd>
      </dl>
    </article>
  );
}

export function EvidenceReferences({
  ids,
  records,
}: {
  ids: string[];
  records: Evidence[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (selected !== null && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [selected]);
  const record = records.find((e) => e.id === selected);
  const related = record?.contradiction
    ? records.filter((e) => e.factor === record.factor && e.id !== record.id)
    : [];
  return (
    <>
      <div className="citation-list">
        {ids.length ? (
          [...new Set(ids)].map((id) => (
            <button
              className="citation-chip"
              key={id}
              aria-haspopup="dialog"
              onClick={() => setSelected(id)}
            >
              {id}{" "}
              <span>
                {records.find((e) => e.id === id)?.factor ?? "Unavailable"}
              </span>
            </button>
          ))
        ) : (
          <p>No supporting evidence references were supplied.</p>
        )}
      </div>
      <dialog
        className="evidence-dialog"
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setSelected(null)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const stops = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button, [tabindex="0"]',
            ),
          );
          const current = stops.indexOf(document.activeElement as HTMLElement);
          if (event.shiftKey && current <= 0) {
            event.preventDefault();
            stops.at(-1)?.focus();
          } else if (!event.shiftKey && current === stops.length - 1) {
            event.preventDefault();
            stops[0]?.focus();
          }
        }}
      >
        <header>
          <h2 id={titleId}>Evidence reference · {selected}</h2>
          <button
            autoFocus
            onClick={() => dialog.current?.close()}
            aria-label="Close evidence reference"
          >
            Close <X size={16} aria-hidden="true" />
          </button>
        </header>
        <p className="citation-notice">
          A citation is a reference, not proof of verification. Records below
          come from the currently loaded opportunity snapshot.
        </p>
        <div
          className="dialog-records"
          tabIndex={0}
          role="region"
          aria-label="Evidence record details"
        >
          {record ? (
            <>
              {record.contradiction && (
                <div className="conflict-notice">
                  <strong>Conflict requires human diligence</strong>
                  <p>
                    Records are grouped by evidence factor. Different recorded
                    values or a disputed status trigger the conflict flag; AI
                    has not resolved it. Human-review metadata is shown for each
                    source.
                  </p>
                </div>
              )}
              <div
                className={
                  related.length ? "conflict-comparison" : "single-evidence"
                }
              >
                <EvidenceRecord record={record} />
                {related.map((e) => (
                  <EvidenceRecord key={e.id} record={e} />
                ))}
              </div>
              {record.contradiction && !related.length && (
                <p className="notice">
                  No other record for this factor is available in this snapshot.
                  A disputed status alone can trigger a conflict flag.
                </p>
              )}
            </>
          ) : (
            <div className="empty">
              <h3>Evidence reference unavailable</h3>
              <p>
                This ID is absent from the current opportunity snapshot. It may
                be missing or out of date. No verification can be inferred.
                Close this panel and refresh the workspace to reload records.
              </p>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

export function ExplanationPanel({
  explanation,
  match,
  records,
}: {
  explanation: Explanation;
  match: Match;
  records: Evidence[];
}) {
  const approved = new Map(
    match.checks.map((c) => [`${c.rule}: ${c.result}.`, c]),
  );
  const eligibility = `Eligibility: ${match.status}. Human diligence is required.`;
  const statements = explanation.statements.filter(
    (s) => s === eligibility || approved.has(s),
  );
  return (
    <div className="explanation result-enter">
      <section>
        <h4>Decision</h4>
        <div className="explanation-decision">
          <span>
            Eligibility <Badge status={match.status} />
          </span>
          <span>
            Weighted score <strong>{match.score}/100</strong>
          </span>
        </div>
        <p>
          Deterministic ranking index, not an investment recommendation or
          verified confidence probability.
        </p>
      </section>
      <section>
        <h4>Why this decision?</h4>
        <p>Selected from preapproved statements; rendered deterministically.</p>
        <ul className="selected-statements">
          {statements.map((s, i) => (
            <li key={`${s}-${i}`}>
              {approved.has(s) ? <RuleCheck {...approved.get(s)!} /> : s}
            </li>
          ))}
        </ul>
        {statements.length !== explanation.statements.length && (
          <p className="notice">
            Some explanation statements do not match the current decision
            snapshot and were not displayed.
          </p>
        )}
      </section>
      <section>
        <h4>Supporting evidence</h4>
        <p>
          References do not establish verification. Eligible matches can still
          have disputed, stale or unverified evidence.
        </p>
        <EvidenceReferences
          ids={explanation.evidence_ids}
          records={records.filter((e) => match.evidence_ids.includes(e.id))}
        />
      </section>
      <section>
        <h4>How this explanation was generated</h4>
        <Badge
          status={
            explanation.mode === "cloudflare"
              ? "Cloudflare AI selection"
              : "Deterministic fallback"
          }
        />
        <p>{explanation.reason}</p>
        <small className="explanation-policy">
          Preapproved statements only · No AI-generated scores or eligibility.
          AI selects statements; deterministic rules determine eligibility and
          calculate scores.
        </small>
      </section>
    </div>
  );
}
