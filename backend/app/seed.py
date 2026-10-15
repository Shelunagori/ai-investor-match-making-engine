"""Fixed observations deliberately include missing, stale and contradictory evidence."""

from .models import Opportunity, Partner

AS_OF = "2026-10-14"
FACTORS = [
    "technology",
    "integration",
    "procurement",
    "traction",
    "deployment",
    "regulatory",
]


def dataset():
    rows = [
        (
            "volt",
            "VoltWeave",
            "Battery storage",
            "Modular long-duration storage for industrial microgrids.",
            "Series A",
            "Europe",
            8,
            7,
            2,
            "Diligence",
        ),
        (
            "h2",
            "Horizon H₂",
            "Hydrogen",
            "Electrolyser systems for distributed green hydrogen production.",
            "Seed",
            "India",
            4,
            5,
            4,
            "Discovery",
        ),
        (
            "geo",
            "TerraLoop",
            "Geothermal",
            "Closed-loop geothermal heat for district networks.",
            "Series B",
            "North America",
            24,
            8,
            3,
            "Pilot design",
        ),
        (
            "heat",
            "EmberWorks",
            "Industrial heat",
            "Electric thermal batteries replacing fossil process heat.",
            "Series A",
            "Europe",
            12,
            7,
            3,
            "Diligence",
        ),
        (
            "grid",
            "GridLoom",
            "Grid modernization",
            "Grid orchestration and demand flexibility for utilities.",
            "Seed",
            "North America",
            3,
            8,
            1,
            "Pilot design",
        ),
        (
            "carbon",
            "CarbonArc",
            "Carbon management",
            "Mineralization of captured carbon in construction materials.",
            "Unknown",
            "India",
            6,
            None,
            None,
            "Discovery",
        ),
    ]
    opportunities = []
    for i, row in enumerate(rows):
        (
            oid,
            name,
            sector,
            description,
            stage,
            geography,
            capital,
            trl,
            integration,
            pipeline,
        ) = row
        evidence = []
        for j, factor in enumerate(FACTORS):
            if (i + j) % 5 == 4:
                continue
            evidence.append(
                dict(
                    id=f"{oid}-e{j}",
                    factor=factor,
                    value=f"{factor.title()} assessment recorded; human diligence required",
                    source=f"{name} / fictional dossier §{j + 1}",
                    observed="2026-08-20" if j % 3 else "2025-12-01",
                    verified="2026-09-01" if j % 2 else None,
                    status="verified" if j % 2 else "unverified",
                    human_review="reviewed" if j % 2 else "pending",
                )
            )
        if i == 0:
            evidence.append(
                dict(
                    id="volt-conflict",
                    factor="technology",
                    value="Conflicting pilot maturity report",
                    source="Fictional independent pilot memo",
                    observed="2026-09-10",
                    status="disputed",
                )
            )
        opportunities.append(
            Opportunity(
                id=oid,
                name=name,
                sector=sector,
                description=description,
                stage=stage,
                geography=geography,
                capital=capital,
                trl=trl,
                integration=integration,
                pipeline=pipeline,
                evidence=evidence,
            )
        )
    partners = [
        Partner(
            id="north",
            name="Northstar Climate",
            kind="Investor",
            sectors=["Battery storage", "Industrial heat", "Grid modernization"],
            stages=["Seed", "Series A"],
            geographies=["Europe", "North America"],
            min_capital=2,
            max_capital=15,
            min_trl=6,
            thesis="Deployment-ready electrification and grid resilience.",
        ),
        Partner(
            id="frontier",
            name="Frontier Transition",
            kind="Investor",
            sectors=["Hydrogen", "Carbon management", "Geothermal"],
            stages=["Seed", "Series A", "Series B"],
            geographies=["India", "Europe", "North America"],
            min_capital=3,
            max_capital=30,
            min_trl=5,
            thesis="Patient capital for hard-to-abate industries.",
        ),
        Partner(
            id="atlas",
            name="Atlas Industrial",
            kind="Industrial buyer",
            sectors=["Battery storage", "Industrial heat", "Hydrogen"],
            stages=["Series A", "Series B"],
            geographies=["Europe", "India"],
            min_capital=1,
            max_capital=20,
            min_trl=7,
            max_integration=3,
            thesis="Low-disruption industrial heat and storage pilots.",
        ),
        Partner(
            id="civic",
            name="Civic Grid Collective",
            kind="Industrial buyer",
            sectors=["Grid modernization", "Geothermal"],
            stages=["Seed", "Series A", "Series B"],
            geographies=["North America"],
            min_capital=1,
            max_capital=30,
            min_trl=7,
            max_integration=3,
            thesis="Utility modernization and district heating deployments.",
        ),
    ]
    return opportunities, partners
