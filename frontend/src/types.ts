export type Jurisdiction = "central" | "karnataka";
export type Verdict = "Eligible" | "Not eligible" | "Not applicable";
export type Language = "en" | "hi" | "kn";

export interface Facts {
  state: string;
  daysWorkedLast12m: number;
  eshramRegistered: boolean;
  platforms: string[];
  vehicle: "bicycle" | "two_wheeler" | "three_wheeler" | "four_wheeler" | "none";
  age: number;
}

export interface Cited { id: string; source: string; confidence: string; effect: string; file: string }

export interface Result {
  benefitId: string;
  verdict: Verdict;
  avpPolicyIds: string[];
  cited: Cited[];
}

export interface EvaluateResponse {
  caseId: string;
  rulebook: Jurisdiction;
  rulebookName: string;
  rulesetVersion: string;
  results: Result[];
}

export interface Why { label: string; met: boolean; actual: unknown; required: unknown }

export interface ExplainItem extends Pick<Result, "benefitId" | "verdict" | "cited"> {
  why: Why[];
  nextStep: string;
}
