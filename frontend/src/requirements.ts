import data from "./data/requirements.json";
import type { Facts, Verdict, Why } from "./types";

type Req = { policyId: string; label: string; field: keyof Facts; op: "eq" | "gte" | "containsAny"; value: unknown };
type Benefit = { name: string; requirements: Req[]; nextStep: Record<Verdict, string> };
const benefits = (data as { benefits: Record<string, Benefit> }).benefits;

export function benefitName(id: string): string { return benefits[id]?.name ?? id; }

export function evaluateWhy(benefitId: string, facts: Facts): Why[] {
  const b = benefits[benefitId];
  if (!b) return [];
  return b.requirements.map((r) => {
    const actual = facts[r.field];
    let met = false;
    if (r.op === "eq") met = actual === r.value;
    else if (r.op === "gte") met = typeof actual === "number" && actual >= (r.value as number);
    else if (r.op === "containsAny") met = Array.isArray(actual) && (r.value as string[]).some((v) => actual.includes(v));
    return { label: r.label, met, actual, required: r.value };
  });
}

export function nextStepFor(benefitId: string, verdict: Verdict): string {
  return benefits[benefitId]?.nextStep[verdict] ?? "";
}
