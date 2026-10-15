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
