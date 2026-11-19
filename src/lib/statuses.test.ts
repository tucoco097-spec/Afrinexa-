import { describe, it, expect } from "vitest";
import { progressFor, AIR_STATUSES, SEA_STATUSES } from "./statuses";

describe("shipment statuses", () => {
  it("has 16 air and 16 sea steps", () => {
    expect(AIR_STATUSES.length).toBe(16);
    expect(SEA_STATUSES.length).toBe(16);
  });
  it("delivered is 100%", () => {
    expect(progressFor("air", "Livré")).toBe(100);
    expect(progressFor("sea", "Livré")).toBe(100);
  });
  it("unknown status is 0%", () => {
    expect(progressFor("air", "Retard")).toBe(0);
  });
});
