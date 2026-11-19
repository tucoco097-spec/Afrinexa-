import { describe, it, expect } from "vitest";
import { convert } from "./money";
const r = { rate_usd_xaf: 600, rate_eur_xaf: 655.957 };
describe("currency conversion", () => {
  it("USD to XAF uses the configured rate", () => expect(convert(10, "USD", "XAF", r)).toBe(6000));
  it("EUR to XAF uses the configured rate", () =>
    expect(convert(1, "EUR", "XAF", r)).toBeCloseTo(655.957));
  it("XAF to USD divides by the rate", () => expect(convert(6000, "XAF", "USD", r)).toBe(10));
  it("same currency is unchanged", () => expect(convert(42, "EUR", "EUR", r)).toBe(42));
  it("rejects non-positive configured rates", () => {
    expect(() => convert(10, "USD", "XAF", { ...r, rate_usd_xaf: 0 })).toThrow(RangeError);
  });
});
