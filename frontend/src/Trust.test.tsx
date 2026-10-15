import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EvidenceRecord,
  EvidenceReferences,
  ExplanationPanel,
  RuleCheck,
  ruleMeaning,
} from "./Trust";
import { MatchCard } from "./App";
import type { Evidence, Match } from "./api";

const evidence: Evidence = {
  id: "carbon-e0",
  factor: "technology",
  value: "Fictional assessment",
  source: "Synthetic dossier",
  source_type: "Synthetic diligence record",
  observed: "2026-08-20",
  verified: null,
  status: "unverified",
  human_review: "pending",
  confidence: "Unknown",
  age_days: 200,
  fresh: false,
  contradiction: true,
};
const match: Match = {
  partner: {
    id: "north",
    name: "Northstar",
    kind: "Investor",
    sectors: [],
    stages: [],
    geographies: [],
    min_capital: 1,
    max_capital: 20,
    min_trl: 6,
    max_integration: 3,
    thesis: "Fictional",
  },
  status: "rejected",
  score: 28.7,
  checks: [
    { rule: "Sector mandate", result: "fail" },
    { rule: "Funding stage", result: "unknown" },
    { rule: "Target geography", result: "pass" },
  ],
  components: [],
  reasons: [],
  semantic: "unavailable",
  evidence_ids: [evidence.id],
  trace: [],
};

describe("rule semantics", () => {
  it.each(["pass", "fail", "unknown"])(
    "renders explicit %s indicators",
    (result) => {
      render(<RuleCheck rule="Funding stage" result={result} />);
      expect(screen.getByText(result)).toBeVisible();
      expect(
        screen.getByText(ruleMeaning("Funding stage", result)),
      ).toBeVisible();
    },
  );
  it("distinguishes missing source fields from evidence quality", () => {
    expect(ruleMeaning("Funding stage", "unknown")).toContain(
      "recorded as Unknown",
    );
    expect(ruleMeaning("Technology readiness", "unknown")).toContain(
      "TRL is not recorded",
    );
    expect(ruleMeaning("Integration constraint", "unknown")).toContain(
      "integration complexity is not recorded",
    );
    expect(ruleMeaning("Future rule", "unknown")).toContain(
      "does not establish",
    );
  });
});

describe("evidence provenance", () => {
  it("preserves source, missing verification, stale and review metadata", () => {
    render(<EvidenceRecord record={evidence} />);
    expect(screen.getByText("Synthetic dossier")).toBeVisible();
    expect(screen.getByText("20-08-2026")).toBeVisible();
    expect(screen.getByText("Not recorded")).toBeVisible();
    expect(screen.getByText("unverified")).toBeVisible();
    expect(screen.getByText("Stale", { exact: true })).toBeVisible();
    expect(screen.getByText("Human review pending")).toBeVisible();
    expect(screen.getByText(/not independent verification/)).toBeVisible();
  });
  it("does not invent a record for a missing reference", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute("open", "");
      }),
    });
    render(<EvidenceReferences ids={["missing-id"]} records={[evidence]} />);
    fireEvent.click(screen.getByRole("button", { name: /missing-id/ }));
    expect(
      within(screen.getByRole("dialog")).getByText(
        "Evidence reference unavailable",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  });
  it("shows an honest empty citation state", () => {
    render(<EvidenceReferences ids={[]} records={[]} />);
    expect(
      screen.getByText("No supporting evidence references were supplied."),
    ).toBeVisible();
  });
});

describe("grounded explanation", () => {
  it.each(["cloudflare", "deterministic"])(
    "labels %s and uses the matching result as decision authority",
    (mode) => {
      render(
        <ExplanationPanel
          match={match}
          records={[evidence]}
          explanation={{
            mode,
            reason: "Provider outcome",
            status: "eligible",
            statements: [
              "Sector mandate: fail.",
              "Funding stage: unknown.",
              "Fabricated recommendation",
            ],
            evidence_ids: [evidence.id],
          }}
        />,
      );
      expect(
        screen.getByText(
          mode === "cloudflare"
            ? "Cloudflare AI selection"
            : "Deterministic fallback",
        ),
      ).toBeVisible();
      expect(screen.getByText("rejected", { exact: true })).toBeVisible();
      expect(screen.getByText("28.7/100")).toBeVisible();
      expect(
        screen.queryByText("Fabricated recommendation"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("eligible", { exact: true }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /carbon-e0/ })).toBeVisible();
      expect(screen.getByText("fail", { exact: true })).toBeVisible();
      expect(screen.getByText("unknown", { exact: true })).toBeVisible();
    },
  );
});

describe("explanation announcements", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(["cloudflare", "deterministic"])(
    "announces loading and %s completion through one persistent region",
    async (mode) => {
      let resolve!: (value: unknown) => void;
      vi.stubGlobal(
        "fetch",
        vi.fn(
          () =>
            new Promise((done) => {
              resolve = done;
            }),
        ),
      );
      render(<MatchCard match={match} oid="carbon" records={[evidence]} />);
      const status = screen.getByRole("status");
      expect(status).toBeEmptyDOMElement();
      expect(status).toHaveAttribute("aria-live", "polite");
      const button = screen.getByRole("button", {
        name: "Explain this decision",
      });
      button.focus();
      fireEvent.click(button);
      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent("Preparing explanation for Northstar.");
      expect(screen.getAllByRole("status")).toHaveLength(1);
      await act(async () =>
        resolve({
          ok: true,
          json: async () => ({
            mode,
            reason: "Provider outcome",
            status: match.status,
            statements: ["Funding stage: unknown."],
            evidence_ids: [evidence.id],
          }),
        }),
      );
      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent(
        "Explanation ready. Navigate to the Explanation for Northstar region",
      );
      expect(
        screen.getByRole("region", { name: "Explanation for Northstar" }),
      ).toHaveAttribute("aria-busy", "false");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    },
  );
  it("announces failure once via the existing alert and clears loading status", async () => {
    let reject!: (reason: Error) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((_resolve, fail) => {
            reject = fail;
          }),
      ),
    );
    render(<MatchCard match={match} oid="carbon" records={[evidence]} />);
    const status = screen.getByRole("status");
    fireEvent.click(
      screen.getByRole("button", { name: "Explain this decision" }),
    );
    expect(status).toHaveTextContent("Preparing explanation");
    await act(async () => reject(new Error("Connection unavailable")));
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connection unavailable",
    );
    expect(
      screen.getByRole("button", { name: "Explain this decision" }),
    ).toBeEnabled();
  });
});
