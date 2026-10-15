"""Provider envelope regressions; no live Cloudflare calls."""

import asyncio
from datetime import date
import json

import httpx
import pytest

from app.ai import ExplanationService, MAX_SELECTION_BYTES, parse_selection
from app.domain import match
from app.seed import dataset

VALID = '{"statement_ids":[0,1],"evidence_ids":["volt-e0"]}'
# Reproduces the reported production structure, not a verbatim response capture.
WRAPPED = f"Here is the requested JSON:\n```json\n{VALID}\n```\nThese are the selected statements."


@pytest.mark.parametrize(
    "text",
    [
        VALID,
        f"```json\n{VALID}\n```",
        f"```\n{VALID}\n```",
        WRAPPED,
        f"Selected result: {VALID} Thank you.",
    ],
)
def test_supported_wrappers(text):
    assert parse_selection(text).statement_ids == [0, 1]


@pytest.mark.parametrize(
    "text",
    [
        VALID + VALID,
        "{broken} " + VALID,
        VALID + " {broken}",
        "[" + VALID + "]",
        f"```json\n{VALID}\n```\n```json\n{VALID}\n```",
        f"```python\n{VALID}\n```",
        f"```json\n{VALID}",
        f"```json\nprose {VALID}\n```",
        VALID[:-1],
        "null",
        "",
        None,
        {},
        "x" * (MAX_SELECTION_BYTES + 1) + VALID,
        "é" * (MAX_SELECTION_BYTES // 2) + VALID,
        '{"statement_ids":[0],"statement_ids":[1],"evidence_ids":[]}',
        '{"statement_ids":[true],"evidence_ids":[]}',
        '{"statement_ids":[0.0],"evidence_ids":[]}',
        '{"statement_ids":["0"],"evidence_ids":[]}',
        '{"statement_ids":[0,0],"evidence_ids":[]}',
        '{"statement_ids":[0],"evidence_ids":["volt-e0","volt-e0"]}',
        '{"statement_ids":[0],"evidence_ids":[1]}',
        '{"statement_ids":[0],"evidence_ids":[],"score":100}',
        '{"statement_ids":[0],"evidence_ids":[],"claim":"approved"}',
        '{"statement_ids":[0],"evidence_ids":[],"eligibility":true}',
        '{"statement_ids":[NaN],"evidence_ids":[]}',
        '{"statement_ids":[0]}',
        '{"statement_ids":' + "[" * 1100 + "0" + "]" * 1100 + ',"evidence_ids":[]}',
    ],
)
def test_reject_invalid_or_ambiguous_selection(text):
    with pytest.raises(ValueError):
        parse_selection(text)


@pytest.mark.parametrize(
    "selection",
    [
        {"statement_ids": [1], "evidence_ids": []},
        {"statement_ids": [0, -1], "evidence_ids": []},
        {"statement_ids": [0, 999], "evidence_ids": []},
        {"statement_ids": [0], "evidence_ids": ["unknown"]},
        {"statement_ids": [0, 0], "evidence_ids": []},
        {"statement_ids": [0, 1, 2, 3, 4, 5], "evidence_ids": []},
        {"statement_ids": [0], "evidence_ids": [str(i) for i in range(13)]},
        None,
    ],
)
def test_provider_grounding_and_no_retry(monkeypatch, selection):
    run_provider(monkeypatch, json.dumps(selection), expected_mode="deterministic")


def run_provider(monkeypatch, text, expected_mode):
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "test")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "test")
    monkeypatch.setenv("AI_DAILY_CALL_LIMIT", "1")
    opportunities, partners = dataset()
    result = match(opportunities[0], partners[0], date(2026, 10, 14))
    original = json.dumps(result, sort_keys=True)
    calls = []

    async def response(client, url, **kwargs):
        calls.append(kwargs)
        assert client.timeout.read == 12
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            json={
                "success": True,
                "errors": [],
                "messages": [],
                "result": {"response": text},
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", response)
    service = ExplanationService()
    output = asyncio.run(service.explain(result))
    assert output["mode"] == expected_mode
    assert output["status"] == result["status"]
    assert json.dumps(result, sort_keys=True) == original
    if expected_mode == "cloudflare":
        assert output["statements"] == [
            f"Eligibility: {result['status']}. Human diligence is required.",
            f"{result['checks'][0]['rule']}: {result['checks'][0]['result']}.",
        ]
        assert output["evidence_ids"] == ["volt-e0"]
    assert "limit" in asyncio.run(service.explain(result))["reason"]
    assert service.calls == len(calls) == 1
    return output


def test_cloudflare_prose_fence_prose_response(monkeypatch):
    run_provider(monkeypatch, WRAPPED, expected_mode="cloudflare")


@pytest.mark.parametrize(
    "text", [VALID + VALID, VALID[:-1], WRAPPED + "{}", "x" * (MAX_SELECTION_BYTES + 1)]
)
def test_parser_failure_falls_back_without_retry(monkeypatch, text):
    run_provider(monkeypatch, text, expected_mode="deterministic")
