import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import App, { Badge } from "./App";
afterEach(() => vi.unstubAllGlobals());
describe("workspace states", () => {
  it("labels unknown decisions explicitly", () => {
    render(<Badge status="review" />);
    expect(screen.getByText("review")).toBeVisible();
  });
  it("shows actionable API failure and retries", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new Error("Connection unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connection unavailable",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
  it("shows loading honestly while data is pending", () => {
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    render(<App />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading intelligence",
    );
  });
});
