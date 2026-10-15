import { describe, expect, it } from "vitest";
import { formatDate } from "./date";

describe("calendar date display", () => {
  it.each([
    ["2026-10-15", "15-10-2026"],
    ["2026-01-01", "01-01-2026"],
    ["2024-02-29", "29-02-2024"],
    ["2000-02-29", "29-02-2000"],
  ])("formats %s without local timezone conversion", (input, output) => {
    expect(formatDate(input)).toBe(output);
  });
  it.each([
    undefined,
    null,
    "",
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
    "0000-01-01",
    "2026-1-1",
    "2026-10-15T00:00:00Z",
    "invalid",
  ])("labels invalid or missing date %s honestly", (input) => {
    expect(formatDate(input)).toBe("Unknown");
  });
});
