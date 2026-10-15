import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("review route, refresh, links and application return", async ({
  page,
}) => {
  const response = await page.goto("/review");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("AETHER — Engineering Case Study");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("AETHER");
  const links = await page
    .locator('a[href^="#"]')
    .evaluateAll((elements) =>
      elements.map((el) => (el as HTMLAnchorElement).hash),
    );
  for (const hash of links) await expect(page.locator(hash)).toHaveCount(1);
  await page
    .getByRole("link", { name: "Open Evidence & Trust in the application" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Trust starts with a source." }),
  ).toBeVisible();
  const menu = page.getByRole("button", { name: "Toggle navigation" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Engineering case study" }).click();
  await expect(page).toHaveURL(/\/review$/);
});

test("review interactions, keyboard and section navigation", async ({
  page,
}) => {
  await page.goto("/review");
  const navigation = page.getByRole("navigation", {
    name: "Case study sections",
  });
  await navigation.getByRole("link", { name: "Decision flow" }).click();
  await expect(
    navigation.getByRole("link", { name: "Decision flow" }),
  ).toHaveAttribute("aria-current", "location");
  const first = page.getByRole("tab", { name: "Eligible match", exact: true });
  await first.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Rejected match" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "known hard-rule failure",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tabpanel")).toContainText(
    "CarbonArc → Frontier Transition",
  );
  await page.keyboard.press("End");
  await expect(page.getByRole("tabpanel")).toContainText(
    "not a live provider check",
  );
  await navigation.getByRole("link", { name: "Scenario Lab" }).click();
  await page.getByRole("button", { name: "$25M", exact: true }).click();
  await expect(page.getByText("Rejected at $25M")).toBeVisible();
  await expect(page.getByText("Recorded score delta: 0.")).toBeVisible();
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`review accessibility and responsive layout / ${reducedMotion}`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/review");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    await expect(page.locator("html")).toHaveCSS(
      "scroll-behavior",
      reducedMotion === "reduce" ? "auto" : "smooth",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((item) =>
        ["serious", "critical"].includes(item.impact ?? ""),
      ),
    ).toEqual([]);
    if (reducedMotion === "no-preference") {
      await page.screenshot({
        path: `test-results/review-${info.project.name}.png`,
        fullPage: true,
      });
      await page.screenshot({
        path: `test-results/review-${info.project.name}-hero.png`,
      });
    }
    await page
      .getByRole("navigation", { name: "Case study sections" })
      .getByRole("link", { name: /Architecture$/ })
      .click();
    await expect(page.locator("#architecture h2")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
