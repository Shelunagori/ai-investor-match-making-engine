from typing import Literal
from datetime import date
from pydantic import BaseModel, ConfigDict, Field

Stage = Literal["Seed", "Series A", "Series B", "Unknown"]


class Evidence(BaseModel):
    id: str
    factor: str
    value: str
    source: str
    source_type: str = "Synthetic diligence record"
    observed: date
    verified: date | None = None
    status: Literal["verified", "unverified", "disputed"]
    human_review: Literal["pending", "reviewed"] = "pending"
    confidence: str = "Unknown; synthetic evidence is not independently substantiated"


class Opportunity(BaseModel):
    id: str
    name: str
    sector: str
    description: str
    stage: Stage
    geography: str
    capital: float = Field(gt=0, le=1000)
    trl: int | None = Field(default=None, ge=1, le=9)
    integration: int | None = Field(default=None, ge=1, le=5)
    pipeline: str
    evidence: list[Evidence]
    embedding: list[float] | None = None


class Partner(BaseModel):
    id: str
    name: str
    kind: Literal["Investor", "Industrial buyer"]
    sectors: list[str]
    stages: list[str]
    geographies: list[str]
    min_capital: float
    max_capital: float
    min_trl: int
    max_integration: int = 5
    thesis: str
    embedding: list[float] | None = None


class Scenario(BaseModel):
    model_config = ConfigDict(extra="forbid")
    stage: Stage
    geography: Literal["Europe", "North America", "India"]
    capital: float = Field(gt=0, le=1000)
    trl: int = Field(ge=1, le=9)
    buyer_max_integration: int = Field(ge=1, le=5)
