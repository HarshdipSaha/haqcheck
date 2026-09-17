import type { EvaluateResponse, ExplainItem, Facts, Jurisdiction, Language } from "./types";

const BASE = import.meta.env.VITE_API_BASE as string;

export class ApiError extends Error {
  status: number;
  body: unknown;
  // no parameter properties: newer Vite tsconfigs set erasableSyntaxOnly, which rejects them under tsc -b
  constructor(status: number, body: unknown) { super(`API ${status}`); this.status = status; this.body = body; }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, json);
  return json as T;
}

export const evaluate = (facts: Facts, jurisdiction: Jurisdiction) =>
  post<EvaluateResponse>("/evaluate", { facts, jurisdiction });

export const explain = (results: ExplainItem[], language: Language) =>
  post<{ explanations: Record<string, string> }>("/explain", { results, language });
