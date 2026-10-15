import { test, expect, type Page } from "@playwright/test";
async function navigate(page: Page, name: string) {
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page.getByRole("button", { name, exact: true }).click();
}
test("decision → evidence → scenario → evaluation", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "From matches to decisions." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore the opportunity pipeline" })
    .click();
  await expect(
    page.getByRole("heading", { name: "VoltWeave", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("heading", { name: "Northstar Climate", exact: true })
      .first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explain this decision" })
    .first()
    .click();
  await expect(
    page.getByText("AI unavailable: credentials not configured"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Inspect evidence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Trust starts with a source." }),
  ).toBeVisible();
  await expect(
    page.getByText("Conflicting evidence", { exact: true }).first(),
  ).toBeVisible();
  await navigate(page, "Scenario lab");
  await page.getByLabel("Target geography").selectOption("India");
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(
    page.getByText(
      "Hypothetical only. Original records and evidence remain unchanged.",
    ),
  ).toBeVisible();
  await expect(
    page.locator(".scenario-change").filter({ hasText: "Northstar Climate" }),
  ).toContainText("rejected");
  await navigate(page, "Evaluation studio");
  await expect(page.getByText("0 failures", { exact: true })).toBeVisible();
  await page.getByLabel("Recommendations per innovator (K)").selectOption("1");
  await expect(page.getByText("55.6%", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("filters, empty states, tour and responsive dashboard", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Opportunity pipeline" }),
  ).toBeVisible();
  await expect(page.locator("#main > div").first()).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
  await navigate(page, "Opportunities");
  await page
    .getByRole("textbox", { name: "Search opportunities" })
    .fill("nothing matches");
  await expect(
    page.getByText("No opportunities match these filters."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(
    page.getByRole("heading", { name: "VoltWeave", exact: true }),
  ).toBeVisible();
});

test("each screen fits the viewport and has no serious accessibility issues", async ({
  page,
}) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Opportunity pipeline" }),
  ).toBeVisible();
  for (const name of [
    "Overview",
    "Opportunities",
    "Evidence & trust",
    "Scenario lab",
    "Evaluation studio",
  ]) {
    if (name !== "Overview") await navigate(page, name);
    await expect(page.getByRole("status")).toHaveCount(0);
    const overflow = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(overflow.scroll, `${name} overflow`).toBeLessThanOrEqual(
      overflow.width,
    );
    if (name === "Overview")
      await expect(page.locator("#main > div").first()).toHaveCSS(
        "opacity",
        "1",
      );
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((v) => ["serious", "critical"].includes(v.impact ?? ""))
        .map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            summary: n.failureSummary,
          })),
        })),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/${name.replaceAll(" ", "-")}-${test.info().project.name}.png`,
      fullPage: true,
    });
  }
});

test("guided journey reaches all five steps and filtering selects the matching innovator", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Opportunity pipeline" }),
  ).toBeVisible();
  if (
    await page.getByRole("button", { name: "Toggle navigation" }).isVisible()
  ) {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.locator(".profile").click();
  } else
    await page
      .getByRole("button", { name: "Guided tour", exact: true })
      .click();
  await expect(page.getByRole("region", { name: "Guided demo" })).toBeVisible();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Measure behavior before trusting it" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("region", { name: "Guided demo" })).toHaveCount(
    0,
  );
  await navigate(page, "Opportunities");
  await page
    .getByRole("combobox", { name: "Filter by sector" })
    .selectOption("Geothermal");
  await expect(
    page.getByRole("heading", { name: "TerraLoop", exact: true }),
  ).toBeVisible();
});

test("date, hero decoration and keyboard innovator selection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".date-label")).toContainText("14-10-2026");
  const label = page.locator(".hero-overline");
  await expect(label).toHaveCSS("text-decoration-line", "none");
  await expect(label.locator(".live-dot")).toBeVisible();
  await navigate(page, "Scenario lab");
  const select = page.getByLabel("Innovator");
  await select.focus();
  await expect(select).toBeFocused();
  await select.selectOption("geo");
  await expect(
    page.getByRole("heading", { name: "TerraLoop", exact: true }),
  ).toBeVisible();
  const labelBox = await page.locator(".selector > span").boundingBox();
  const selectBox = await select.boundingBox();
  expect(selectBox!.y).toBeGreaterThanOrEqual(labelBox!.y + labelBox!.height);
  await expect(select).toHaveCSS("min-height", "44px");
  await select.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Funding stage")).toBeFocused();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.locator(".scenario-change")).toHaveCount(4);
  await page.screenshot({
    path: `test-results/scenario-result-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("dashboard skeleton, visible error and successful retry", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failing = true;
  await page.route("**/api/dashboard", async (route) => {
    if (failing) {
      await gate;
      await route.fulfill({ status: 503, body: "unavailable" });
    } else await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Loading intelligence");
  await expect(page.locator(".skeleton-layout")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.screenshot({
    path: `test-results/loading-${test.info().project.name}.png`,
    fullPage: true,
  });
  release();
  await expect(page.getByRole("alert")).toContainText(
    "Data service unavailable",
  );
  await expect(page.locator(".skeleton")).toHaveCount(0);
  failing = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Opportunity pipeline" }),
  ).toBeVisible();
});

test("evidence flags preserve synthetic provenance and selection", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Opportunity pipeline" }),
  ).toBeVisible();
  await navigate(page, "Evidence & trust");
  await expect(
    page.getByText("Conflicting evidence", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Unverified", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Stale", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Human review pending", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".notice")).toContainText("not real verification");
  await page.getByLabel("Show only records needing review").check();
  await expect(page.locator(".evidence-record").first()).toBeVisible();
  await page.getByLabel("Innovator").selectOption("carbon");
  await expect(page.locator(".missing-evidence-summary")).toContainText(
    "Missing evidence",
  );
});

test("AI selection and deterministic fallback stay visibly distinct", async ({
  page,
}) => {
  let mode = "cloudflare";
  await page.route("**/api/opportunities/*/explain/*", async (route) => {
    await route.fulfill({
      json: {
        mode,
        reason:
          mode === "cloudflare"
            ? "AI-selected, deterministically rendered statements"
            : "AI unavailable: provider failure or invalid grounded output",
        statements: ["Eligibility: eligible. Human diligence is required."],
        evidence_ids: ["volt-e0"],
        status: "eligible",
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the opportunity pipeline" })
    .click();
  await expect(page.locator(".decision-context")).toContainText(
    "Coverage is not verification",
  );
  await page
    .getByRole("button", { name: "Explain this decision" })
    .first()
    .click();
  await expect(
    page.getByText("Cloudflare AI selection", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".explanation")).toContainText("volt-e0");
  await expect(page.locator(".explanation")).toContainText(
    "No AI-generated scores or eligibility",
  );
  mode = "deterministic";
  await page
    .getByRole("button", { name: "Explain this decision" })
    .first()
    .click();
  await expect(
    page.getByText("Deterministic fallback", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Cloudflare AI selection", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: `test-results/explanation-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("reduced motion disables skeleton shimmer and result animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/dashboard", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator(".skeleton").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  release();
  await page
    .getByRole("button", { name: "Explore the opportunity pipeline" })
    .click();
  await expect(page.locator(".match-grid")).toHaveCSS("animation-name", "none");
});

test("detail skeleton resolves and explanation errors remain actionable", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/opportunities/volt", async (route) => {
    await gate;
    await route.continue();
  });
  await page.route("**/api/opportunities/*/explain/*", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore the opportunity pipeline" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Loading decision trace",
  );
  await expect(page.locator(".detail-loading .skeleton").first()).toBeVisible();
  release();
  await expect(
    page.getByRole("heading", { name: "VoltWeave", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explain this decision" })
    .first()
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Data service unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Explain this decision" }).first(),
  ).toBeEnabled();
  await expect(page.locator(".explanation")).toHaveCount(0);
});
