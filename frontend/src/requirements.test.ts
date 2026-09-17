import { describe, it, expect } from "vitest";
import { evaluateWhy, nextStepFor } from "./requirements";
import type { Facts } from "./types";

const f: Facts = { state: "KA", daysWorkedLast12m: 73, eshramRegistered: true, platforms: ["zomato"], vehicle: "two_wheeler", age: 24 };

describe("evaluateWhy", () => {
  it("marks the 90-day requirement unmet with actual/required", () => {
    const why = evaluateWhy("central_social_security", f);
    const days = why.find((w) => w.label.startsWith("Days worked"))!;
    expect(days.met).toBe(false);
    expect(days.actual).toBe(73);
    expect(days.required).toBe(90);
  });
  it("marks containsAny met when any platform matches", () => {
    const why = evaluateWhy("ka_welfare_fund", { ...f, platforms: ["porter", "zepto"] });
    expect(why.find((w) => w.label.startsWith("On a notified"))!.met).toBe(true);
  });
  it("returns the nextStep text for a verdict", () => {
    expect(nextStepFor("central_social_security", "Not eligible")).toMatch(/90 days/);
  });
});
