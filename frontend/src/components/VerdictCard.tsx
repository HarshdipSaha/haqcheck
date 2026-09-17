import type { Result, Why } from "../types";
import { benefitName } from "../requirements";

interface Props {
  result: Result;
  why: Why[];
  nextStep: string;
  explanation?: string;
  explaining: boolean;
  changed: boolean;
}

const TONE = { "Eligible": "ok", "Not eligible": "no", "Not applicable": "na" } as const;

function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

export function VerdictCard({ result, why, nextStep, explanation, explaining, changed }: Props) {
  const tone = TONE[result.verdict];
  return (
    <section className={`card verdict ${tone} ${changed ? "changed" : ""}`}>
      <header>
        <h3>{benefitName(result.benefitId)}</h3>
        <span className={`badge ${tone}`}>{result.verdict}</span>
      </header>

      <div className="cited">
        {result.cited.length === 0
          ? <p className="muted">No rule permits this yet. Requirements from the rulebook:</p>
          : result.cited.map((c) => (
            <p key={c.id}><code>{c.id}</code> <span className="muted">({c.effect}, {c.confidence})</span><br />{c.source}</p>
          ))}
      </div>

      <ul className="why">
        {why.map((w) => (
          <li key={w.label} className={w.met ? "met" : "unmet"}>
            {w.met ? "✓" : "✗"} {w.label}: <strong>{fmt(w.actual)}</strong> <span className="muted">(needs {fmt(w.required)})</span>
          </li>
        ))}
      </ul>

      <p className="next"><strong>Next step:</strong> {nextStep}</p>

      <div className="explain">
        <small className="muted">Explanation (generated from the rule above; it does not decide)</small>
        <p>{explaining ? "Writing…" : explanation ?? "—"}</p>
      </div>
    </section>
  );
}
