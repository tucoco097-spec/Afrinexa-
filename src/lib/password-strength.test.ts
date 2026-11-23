import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./password-strength";

describe("getPasswordStrength", () => {
  it("marks an empty password as very weak", () => {
    expect(getPasswordStrength("")).toEqual({ score: 0, label: "Very weak" });
  });

  it("rewards length, mixed case, digits and symbols", () => {
    expect(getPasswordStrength("abcdefgh").score).toBe(1);
    expect(getPasswordStrength("Abcdefg1").score).toBe(3);
    expect(getPasswordStrength("Abcdefg1!more").score).toBe(5);
    expect(getPasswordStrength("Abcdefg1!more").label).toBe("Very strong");
  });
});
