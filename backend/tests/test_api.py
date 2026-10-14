import asyncio
import httpx
from fastapi.testclient import TestClient
from app.main import app
from app.ai import ExplanationService
from app.domain import match
from app.seed import dataset
from datetime import date

client = TestClient(app)


def test_api_and_validation(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert client.get("/health").status_code == 200
    assert client.get("/ready").json()["status"] == "ready"
    assert client.get("/api/dashboard").json()["metrics"]["capital"] == 57
    assert client.get("/api/opportunities?limit=0").status_code == 422
    assert len(client.get("/api/opportunities?limit=2").json()["items"]) == 2
    assert client.get("/api/opportunities/missing").status_code == 404
    assert (
        client.post("/api/opportunities/volt/scenario", json={"trl": 10}).status_code
        == 422
    )
    assert client.post("/api/opportunities/volt/explain/missing").status_code == 404


def test_scenario_is_non_mutating():
    before = client.get("/api/opportunities/volt").json()
    result = client.post(
        "/api/opportunities/volt/scenario",
        json={
            "stage": "Seed",
            "geography": "India",
            "capital": 4,
            "trl": 5,
            "buyer_max_integration": 1,
        },
    ).json()
    assert any(c["before"] != c["after"] for c in result["changes"])
    assert client.get("/api/opportunities/volt").json() == before


def test_fallback_and_provider_failure(monkeypatch):
    os, ps = dataset()
    result = match(os[0], ps[0], date(2026, 10, 14))
    monkeypatch.delenv("CLOUDFLARE_API_TOKEN", raising=False)
    assert asyncio.run(ExplanationService().explain(result))["mode"] == "deterministic"
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "test")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "test")

    async def fail(*args, **kwargs):
        raise httpx.ReadTimeout("timeout")

    monkeypatch.setattr(httpx.AsyncClient, "post", fail)
    fallback = asyncio.run(ExplanationService().explain(result))
    assert fallback["mode"] == "deterministic"
    assert "provider failure" in fallback["reason"]


def test_ai_grounding_and_budget(monkeypatch):
    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", "test")
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "test")
    os, ps = dataset()
    result = match(os[0], ps[0], date(2026, 10, 14))

    async def response(*args, **kwargs):
        return httpx.Response(
            200,
            request=httpx.Request("POST", "https://example.com"),
            json={
                "result": {
                    "response": '{"statement_ids":[0,1],"evidence_ids":["volt-e0"]}'
                }
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", response)
    service = ExplanationService()
    assert asyncio.run(service.explain(result))["mode"] == "cloudflare"
    assert "limit" in asyncio.run(service.explain(result))["reason"]

    async def invalid(*args, **kwargs):
        return httpx.Response(
            200,
            request=httpx.Request("POST", "https://example.com"),
            json={
                "result": {
                    "response": '{"statement_ids":[0],"evidence_ids":["invented"]}'
                }
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", invalid)
    assert asyncio.run(ExplanationService().explain(result))["mode"] == "deterministic"
