from datetime import date
import pytest
from app.seed import dataset
from app.domain import match, evidence_report, cosine, evaluate, readiness

NOW = date(2026, 10, 14)


@pytest.fixture
def data():
    return dataset()


def test_eligibility_and_rejection(data):
    os, ps = data
    assert match(os[0], ps[0], NOW)["status"] == "eligible"
    failed = match(os[0], ps[1], NOW)
    assert failed["status"] == "rejected"
    assert "Sector mandate" in failed["reasons"]


def test_unknown_requires_review(data):
    os, ps = data
    assert match(os[-1], ps[1], NOW)["status"] == "review"
    assert (
        match(os[0].model_copy(update={"stage": "Unknown"}), ps[0], NOW)["status"]
        == "review"
    )


def test_missing_stale_and_conflicting_evidence(data):
    os, _ = data
    report = evidence_report(os[0], NOW)
    assert "deployment" in report["missing"]
    assert any(not e["fresh"] for e in report["records"])
    assert sum(e["contradiction"] for e in report["records"]) == 2
    assert readiness(os[0], NOW)["factors"][0]["score"] == 0
    empty = os[0].model_copy(update={"evidence": []})
    assert evidence_report(empty, NOW)["coverage"] == 0
    assert readiness(empty, NOW)["score"] == 0


def test_freshness_boundary(data):
    o = data[0][0]
    e = o.evidence[0].model_copy(
        update={"observed": date(2026, 4, 17), "verified": None}
    )
    assert evidence_report(o.model_copy(update={"evidence": [e]}), NOW)["records"][0][
        "fresh"
    ]
    assert not evidence_report(
        o.model_copy(update={"evidence": [e]}), date(2026, 10, 15)
    )["records"][0]["fresh"]


def test_semantics_never_override_rules(data):
    os, ps = data
    assert cosine([1, 0], [1, 0]) == 1
    assert cosine([1, 0], [0, 1]) == 0
    assert cosine([0], [0]) is None
    assert cosine([1], [1, 2]) is None
    assert cosine([float("nan")], [1]) is None
    result = match(
        os[0].model_copy(update={"embedding": [1, 0]}),
        ps[1].model_copy(update={"embedding": [1, 0]}),
        NOW,
    )
    assert result["status"] == "rejected"
    assert sum(c["weight"] for c in result["components"]) == 100


def test_evaluation_denominators(data):
    result = evaluate(*data, NOW)
    assert result["denominators"] == {
        "returned": 9,
        "relevant": 9,
        "cases": 24,
        "evidence": 30,
        "ambiguous": 1,
    }
    assert result["metrics"]["precision_at_k"] == 1
    assert result["metrics"]["recall_at_k"] == 1
    assert result["metrics"]["hard_rule_violation_rate"] == 0
    assert result["metrics"]["unknown_handling"] == 1
    assert result["regression"]["failures"] == 0
    assert evaluate(*data, NOW, k=1)["metrics"]["recall_at_k"] == 5 / 9
