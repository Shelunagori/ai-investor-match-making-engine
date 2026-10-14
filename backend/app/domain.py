import math
from .seed import FACTORS


def evidence_report(opportunity, as_of):
    records = []
    for e in opportunity.evidence:
        age = (as_of - (e.verified or e.observed)).days
        conflict = (
            e.status == "disputed"
            or len({x.value for x in opportunity.evidence if x.factor == e.factor}) > 1
        )
        records.append(
            {
                **e.model_dump(mode="json"),
                "age_days": age,
                "fresh": 0 <= age <= 180,
                "contradiction": conflict,
            }
        )
    covered = {e.factor for e in opportunity.evidence if e.factor in FACTORS}
    missing = [f for f in FACTORS if f not in covered]
    return {
        "records": records,
        "coverage": round(len(covered) / len(FACTORS) * 100, 1),
        "missing": missing,
        "freshness": round(sum(e["fresh"] for e in records) / len(records) * 100, 1)
        if records
        else 0,
        "review_count": sum(
            e["human_review"] == "pending" or e["contradiction"] for e in records
        ),
    }


def readiness(o, as_of):
    report = evidence_report(o, as_of)
    factors = []
    for factor in FACTORS:
        records = [e for e in report["records"] if e["factor"] == factor]
        score = (
            None
            if not records
            else (
                100
                if any(
                    e["status"] == "verified" and e["fresh"] and not e["contradiction"]
                    for e in records
                )
                else 25
            )
        )
        if any(e["contradiction"] for e in records):
            score = 0
        factors.append(
            {
                "factor": factor,
                "score": score,
                "reason": "Missing evidence"
                if score is None
                else "Verified fresh evidence"
                if score == 100
                else "Conflicting evidence"
                if score == 0
                else "Unverified or stale evidence",
            }
        )
    return {
        "score": round(sum(f["score"] or 0 for f in factors) / len(FACTORS)),
        "factors": factors,
        "methodology": "Equal-weight evidence support index, not a technical or regulatory certification. Unknown factors contribute zero.",
    }


def cosine(a, b):
    if not a or not b or len(a) != len(b) or not all(math.isfinite(x) for x in a + b):
        return None
    norm = math.sqrt(sum(x * x for x in a) * sum(y * y for y in b))
    return max(0, min(1, sum(x * y for x, y in zip(a, b)) / norm)) if norm else None


def match(o, p, as_of):
    checks = []

    def check(label, value):
        checks.append(
            {
                "rule": label,
                "result": "unknown" if value is None else "pass" if value else "fail",
            }
        )

    check("Sector mandate", o.sector in p.sectors)
    check("Funding stage", None if o.stage == "Unknown" else o.stage in p.stages)
    check("Target geography", o.geography in p.geographies)
    check("Capital range", p.min_capital <= o.capital <= p.max_capital)
    check("Technology readiness", None if o.trl is None else o.trl >= p.min_trl)
    if p.kind == "Industrial buyer":
        check(
            "Integration constraint",
            None if o.integration is None else o.integration <= p.max_integration,
        )
    status = (
        "rejected"
        if any(c["result"] == "fail" for c in checks)
        else "review"
        if any(c["result"] == "unknown" for c in checks)
        else "eligible"
    )
    report = evidence_report(o, as_of)
    semantic = cosine(o.embedding, p.embedding)
    values = [
        ("Mandate fit", 40, 100 if o.sector in p.sectors else 0),
        ("Technology maturity", 25, (o.trl or 0) / 9 * 100),
        ("Evidence completeness", 20, report["coverage"]),
        ("Data freshness", 15, report["freshness"]),
    ]
    if semantic is not None:
        values = [(n, w * 0.9, v) for n, w, v in values] + [
            ("Semantic relevance", 10, semantic * 100)
        ]
    components = [
        {
            "name": n,
            "weight": w,
            "value": round(v, 2),
            "contribution": round(w * v / 100, 2),
        }
        for n, w, v in values
    ]
    return {
        "partner": p.model_dump(exclude={"embedding"}),
        "status": status,
        "score": round(sum(c["contribution"] for c in components), 1),
        "checks": checks,
        "components": components,
        "reasons": [c["rule"] for c in checks if c["result"] != "pass"],
        "semantic": "available"
        if semantic is not None
        else "unavailable; structured weights used",
        "evidence_ids": [e.id for e in o.evidence],
        "trace": [
            "Validate source fields",
            "Apply hard eligibility rules",
            "Calculate weighted components",
            "Exclude rejected and review candidates from recommendations",
            "Require human diligence before action",
        ],
    }


def ranked(o, partners, as_of):
    return sorted(
        [match(o, p, as_of) for p in partners],
        key=lambda m: (
            {"eligible": 0, "review": 1, "rejected": 2}[m["status"]],
            -m["score"],
            m["partner"]["id"],
        ),
    )


# Independently authored labels for the fixed benchmark, not generated by matching logic.
LABELS = {
    "volt": {"north": "valid", "atlas": "valid"},
    "h2": {"frontier": "valid"},
    "geo": {"frontier": "valid", "civic": "valid"},
    "heat": {"north": "valid", "atlas": "valid"},
    "grid": {"north": "valid", "civic": "valid"},
    "carbon": {"frontier": "ambiguous"},
}


def evaluate(opportunities, partners, as_of, k=2):
    cases, tp, returned, relevant, violations, unknown = [], 0, 0, 0, 0, 0
    for o in opportunities:
        results = ranked(o, partners, as_of)
        selected = [r for r in results if r["status"] == "eligible"][:k]
        valid = {pid for pid, label in LABELS[o.id].items() if label == "valid"}
        tp += sum(r["partner"]["id"] in valid for r in selected)
        returned += len(selected)
        relevant += len(valid)
        violations += sum(
            any(c["result"] == "fail" for c in r["checks"]) for r in selected
        )
        for r in results:
            label = LABELS[o.id].get(r["partner"]["id"], "invalid")
            unknown += label == "ambiguous" and r["status"] == "review"
            cases.append(
                {
                    "opportunity": o.name,
                    "partner": r["partner"]["name"],
                    "label": label,
                    "actual": r["status"],
                    "passed": r["status"]
                    == {
                        "valid": "eligible",
                        "invalid": "rejected",
                        "ambiguous": "review",
                    }[label],
                }
            )
    evidence = [e for o in opportunities for e in evidence_report(o, as_of)["records"]]
    metrics = {
        "precision_at_k": tp / returned if returned else None,
        "recall_at_k": tp / relevant if relevant else None,
        "hard_rule_violation_rate": violations / returned if returned else None,
        "evidence_coverage": sum(
            evidence_report(o, as_of)["coverage"] for o in opportunities
        )
        / len(opportunities)
        / 100,
        "data_freshness": sum(e["fresh"] for e in evidence) / len(evidence)
        if evidence
        else None,
        "unknown_handling": unknown,
    }
    return {
        "version": "synthetic-v1",
        "as_of": str(as_of),
        "k": k,
        "metrics": metrics,
        "denominators": {
            "returned": returned,
            "relevant": relevant,
            "cases": len(cases),
            "evidence": len(evidence),
            "ambiguous": 1,
        },
        "cases": cases,
        "regression": {
            "baseline": "synthetic-v1 expected rule labels",
            "failures": sum(not c["passed"] for c in cases),
        },
        "limitations": "Small authored synthetic benchmark; not real-world accuracy. Precision divides by returned recommendations (up to K per opportunity). Ambiguous labels excluded from precision/recall relevance.",
    }
