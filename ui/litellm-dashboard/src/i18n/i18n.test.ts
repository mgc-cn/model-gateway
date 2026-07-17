import { describe, expect, it } from "vitest";
import { normalizeLocale } from "./config";
import { formatCurrency, formatDate, formatNumber } from "./format";

describe("normalizeLocale", () => {
  it("normalizes supported language variants", () => {
    expect(normalizeLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeLocale("zh-Hans")).toBe("zh-CN");
    expect(normalizeLocale("en-US")).toBe("en");
  });

  it("rejects unsupported or missing locales", () => {
    expect(normalizeLocale("fr-FR")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });
});

describe("locale formatters", () => {
  it("uses the requested locale instead of the host locale", () => {
    const date = new Date("2026-07-16T00:00:00.000Z");
    expect(formatDate(date, "en", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })).toBe(
      "Jul 16, 2026",
    );
    expect(formatDate(date, "zh-CN", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })).toBe(
      "2026年7月16日",
    );
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatCurrency(12.5, "USD", "zh-CN")).toContain("12.50");
  });
});
