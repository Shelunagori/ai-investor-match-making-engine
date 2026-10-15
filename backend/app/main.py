import logging
import os
import time
import uuid
from datetime import date
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .repository import Repository
from .domain import evidence_report, readiness, ranked, evaluate
from .models import Scenario
from .ai import ExplanationService

app = FastAPI(title="AETHER Commercial Intelligence & Trust OS", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
repo = Repository()
ai = ExplanationService()
logger = logging.getLogger("aether")
logging.basicConfig(level=logging.INFO)


def today():
    return date.fromisoformat(os.getenv("AS_OF_DATE", date.today().isoformat()))


def records():
    try:
        return repo.all()
    except Exception:
        raise HTTPException(
            503, "Repository unavailable; verify connection and seed data"
        ) from None


def get_opportunity(oid):
    opportunities, partners = records()
    o = next((o for o in opportunities if o.id == oid), None)
    if o is None:
        raise HTTPException(404, "Opportunity not found")
    return o, partners


@app.middleware("http")
async def request_log(request: Request, call_next):
    start, request_id = time.monotonic(), str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request=%s method=%s status=%s duration_ms=%.1f",
        request_id,
        request.method,
        response.status_code,
        (time.monotonic() - start) * 1000,
    )
    return response


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    try:
        opportunities, partners = repo.all()
        return {
            "status": "ready",
            "repository": "postgres"
            if os.getenv("DATABASE_URL")
            else "synthetic fixture",
            "opportunities": len(opportunities),
            "partners": len(partners),
            "ai": "configured; connectivity unverified"
            if os.getenv("CLOUDFLARE_API_TOKEN") and os.getenv("CLOUDFLARE_ACCOUNT_ID")
            else "unavailable",
        }
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unavailable",
                "detail": "Repository connection or seed failed",
            },
        )


@app.get("/api/dashboard")
def dashboard():
    opportunities, partners = records()
    enriched = [
        {
            **o.model_dump(mode="json", exclude={"embedding"}),
            "trust": evidence_report(o, today()),
            "readiness": readiness(o, today()),
            "eligible_count": sum(
                r["status"] == "eligible" for r in ranked(o, partners, today())
            ),
        }
        for o in opportunities
    ]
    return {
        "as_of": str(today()),
        "synthetic": True,
        "opportunities": enriched,
        "partners": [p.model_dump(exclude={"embedding"}) for p in partners],
        "metrics": {
            "opportunities": len(opportunities),
            "capital": sum(o.capital for o in opportunities),
            "eligible_matches": sum(o["eligible_count"] for o in enriched),
            "reviews": sum(o["trust"]["review_count"] for o in enriched),
            "evidence_coverage": round(
                sum(o["trust"]["coverage"] for o in enriched) / len(enriched), 1
            )
            if enriched
            else 0,
        },
    }


@app.get("/api/opportunities")
def opportunities(
    sector: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    rows, _ = records()
    rows = [o for o in rows if sector is None or o.sector == sector]
    return {
        "total": len(rows),
        "items": [
            o.model_dump(mode="json", exclude={"embedding"})
            for o in rows[offset : offset + limit]
        ],
    }


@app.get("/api/opportunities/{oid}")
def detail(oid: str):
    o, partners = get_opportunity(oid)
    return {
        "opportunity": o.model_dump(mode="json", exclude={"embedding"}),
        "matches": ranked(o, partners, today()),
        "trust": evidence_report(o, today()),
        "readiness": readiness(o, today()),
    }


@app.post("/api/opportunities/{oid}/scenario")
def scenario(oid: str, changes: Scenario):
    o, partners = get_opportunity(oid)
    hypothetical = o.model_copy(
        update=changes.model_dump(exclude={"buyer_max_integration"})
    )
    changed_partners = [
        p.model_copy(update={"max_integration": changes.buyer_max_integration})
        if p.kind == "Industrial buyer"
        else p
        for p in partners
    ]
    baseline, simulated = (
        ranked(o, partners, today()),
        ranked(hypothetical, changed_partners, today()),
    )
    by_id = {r["partner"]["id"]: r for r in baseline}
    return {
        "baseline": baseline,
        "simulated": simulated,
        "changes": [
            {
                "partner": r["partner"]["name"],
                "before": by_id[r["partner"]["id"]]["status"],
                "after": r["status"],
                "score_delta": round(
                    r["score"] - by_id[r["partner"]["id"]]["score"], 1
                ),
                "reasons": r["reasons"],
            }
            for r in simulated
        ],
        "notice": "Hypothetical only. Original records and evidence remain unchanged.",
    }


@app.get("/api/evaluation")
def evaluation(k: int = Query(2, ge=1, le=4)):
    opportunities, partners = records()
    return evaluate(opportunities, partners, today(), k)


@app.post("/api/opportunities/{oid}/explain/{pid}")
async def explain(oid: str, pid: str):
    o, partners = get_opportunity(oid)
    result = next(
        (r for r in ranked(o, partners, today()) if r["partner"]["id"] == pid), None
    )
    if result is None:
        raise HTTPException(404, "Partner not found")
    return await ai.explain(result)
