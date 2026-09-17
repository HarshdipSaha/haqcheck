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

const TONE = {
  Eligible: "ok",
  "Not eligible": "no",
  "Not applicable": "na",
} as const;

function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function VerdictCard({
  result,
  why,
  nextStep,
  explanation,
  explaining,
  changed,
}: Props) {
  const tone = TONE[result.verdict];
  const isEligible = result.verdict === "Eligible";
  const isNotEligible = result.verdict === "Not eligible";

  // Check if there is a days worked requirement to show a progress bar
  const daysReq = why.find((w) => w.label.toLowerCase().includes("days worked"));
  const daysActual = typeof daysReq?.actual === "number" ? daysReq.actual : 0;
  const daysRequired = typeof daysReq?.required === "number" ? daysReq.required : 90;
  const progressPercent = Math.min(100, Math.round((daysActual / daysRequired) * 100));

  return (
    <section className={`card verdict-card ${tone} ${changed ? "changed" : ""}`}>
      {/* Header */}
      <div className="verdict-header">
        <div>
          <span className="benefit-jurisdiction-tag">
            {result.benefitId.startsWith("ka_") ? "State Scheme (Karnataka)" : "National Central Scheme"}
          </span>
          <h3>{benefitName(result.benefitId)}</h3>
        </div>
        <span className={`badge ${tone}`}>
          {isEligible && "✓ "}
          {isNotEligible && "✕ "}
          {result.verdict === "Not applicable" && "— "}
          {result.verdict}
        </span>
      </div>

      {/* Cited Cedar Rulebox */}
      <div className="citation-box">
        {result.cited.length === 0 ? (
          <p className="citation-text" style={{ color: "#64748b", fontStyle: "italic" }}>
            No rule permits this benefit under the current facts. Requirements according to the rulebook:
          </p>
        ) : (
          result.cited.map((c) => (
            <div key={c.id}>
              <div className="citation-header">
                <span className="rule-id-tag">
                  <code>{c.id}</code>
                </span>
                <span className="confidence-tag">
                  Effect: <strong>{c.effect}</strong> · {c.confidence}
                </span>
              </div>
              <p className="citation-text">{c.source}</p>
            </div>
          ))
        )}
      </div>

      {/* Requirements Checklist */}
      <ul className="requirements-checklist">
        {why.map((w) => (
          <li key={w.label} className={`requirement-item ${w.met ? "met" : "unmet"}`}>
            <div>
              <span className="req-label">
                <span className={`req-icon ${w.met ? "met" : "unmet"}`}>{w.met ? "✓" : "✕"}</span>
                {w.label}
              </span>
              {w.label.toLowerCase().includes("days worked") && (
                <div className="progress-container">
                  <div
                    className={`progress-bar ${w.met ? "met" : "unmet"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
            <span className="req-stats">
              <strong>{fmt(w.actual)}</strong> / {fmt(w.required)}
            </span>
          </li>
        ))}
      </ul>

      {/* Next Step Box */}
      {nextStep && (
        <div className="next-step-box">
          <span className="next-step-icon">💡</span>
          <div>
            <strong>Next Action:</strong> {nextStep}
          </div>
        </div>
      )}

      {/* Vernacular Bedrock Explanation */}
      <div className="explain-box">
        <div className="explain-header">
          <span className="explain-title">
            <span>🗣️ Plain-Language Explanation</span>
          </span>
          <span className="bedrock-badge">Amazon Bedrock · Nova Lite Grounded</span>
        </div>

        {explaining ? (
          <div className="shimmer-skeleton" aria-label="Loading explanation">
            <div className="shimmer-line w-full" />
            <div className="shimmer-line w-80" />
            <div className="shimmer-line w-60" />
          </div>
        ) : (
          <p className="explain-body">{explanation ?? "No explanation available."}</p>
        )}
      </div>
    </section>
  );
}
