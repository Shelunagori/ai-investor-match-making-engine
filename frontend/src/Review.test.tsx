import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import Review from "./Review";
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());
describe("engineering review", () => {
  it("discloses illustrative data and exposes valid section links", () => {
    render(<Review />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "AETHER",
    );
    expect(
      screen.getByText(
        "Independent technical proof of concept · Synthetic demonstration data",
      ),
    ).toBeVisible();
    document
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((link) => {
        expect(document.getElementById(link.hash.slice(1))).not.toBeNull();
      });
  });
  it("supports arrow-key, Home and End navigation with a single active tab", () => {
    render(<Review />);
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) =>
      expect(
        document.getElementById(tab.getAttribute("aria-controls")!),
      ).not.toBeNull(),
    );
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "CarbonArc → Northstar Climate",
    );
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "not a live provider check",
    );
    fireEvent.keyDown(tabs[3], { key: "Home" });
    expect(tabs[0]).toHaveFocus();
    expect(tabs.filter((tab) => tab.tabIndex === 0)).toHaveLength(1);
  });
  it("toggles recorded capital outcomes without fabricating score changes", () => {
    render(<Review />);
    fireEvent.click(screen.getByRole("button", { name: "$25M" }));
    expect(screen.getByText("Rejected at $25M")).toBeVisible();
    expect(screen.getByText("Recorded score delta: 0.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "$8M" }));
    expect(screen.getByText("Eligible at $8M")).toBeVisible();
  });
  it("restores document state when unmounted", () => {
    const title = document.title;
    const { unmount } = render(<Review />);
    expect(document.title).toBe("AETHER — Engineering Case Study");
    unmount();
    expect(document.title).toBe(title);
    expect(document.documentElement).not.toHaveClass("review-document");
  });
});
