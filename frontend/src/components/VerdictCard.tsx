import { useEffect, useState } from "react";
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

function titleCase(v: string): string {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? titleCase(x) : String(x))).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/** Requirement labels sometimes carry a parenthetical detail list that
 * duplicates the value column; show the short form and keep the detail
 * as a hover title instead of wrapping the checklist onto three lines. */
function splitLabel(label: string): { text: string; detail?: string } {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(label);
  return m ? { text: m[1], detail: m[2] } : { text: label };
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

  const daysReq = why.find((w) => w.label.toLowerCase().includes("days worked"));
  const daysActual = typeof daysReq?.actual === "number" ? daysReq.actual : 0;
  const daysRequired = typeof daysReq?.required === "number" ? daysReq.required : 90;
  const progressPercent = Math.min(100, Math.round((daysActual / daysRequired) * 100));

  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    setBarWidth(0);
    const id = requestAnimationFrame(() => setBarWidth(progressPercent));
    return () => cancelAnimationFrame(id);
  }, [progressPercent]);

  return (
    <section className={`card verdict-card ${tone} ${changed ? "changed" : ""}`}>
      {/* Header */}
      <div className="verdict-header">
        <div>
          <h3 className="verdict-title">
            {benefitName(result.benefitId)}{" "}
            <span className="scheme-note">
              — {result.benefitId.startsWith("ka_") ? "Karnataka" : "Central"}
            </span>
          </h3>
        </div>

        <span className={`badge ${tone}`}>
          {isEligible && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
            </svg>
          )}
          {isNotEligible && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          )}
          {result.verdict === "Not applicable" && (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="8" x2="12" y2="8" />
            </svg>
          )}
          <span>{result.verdict}</span>
        </span>
      </div>

      {/* Cited Cedar Rulebox */}
      <div className="citation-box">
        {result.cited.length === 0 ? (
          <p className="citation-source" style={{ fontStyle: "italic", opacity: 0.7 }}>
            No permit rule matched under the current facts. Mandatory conditions from rulebook:
          </p>
        ) : (
          result.cited.map((c) => (
            <div key={c.id}>
              <div className="citation-meta">
                <span className="rule-id">{c.id}</span>
                <span className="rule-effect">
                  Effect: <strong>{c.effect}</strong> · {c.confidence}
                </span>
              </div>
              <p className="citation-source">{c.source}</p>
            </div>
          ))
        )}
      </div>

      {/* Requirements Checklist */}
      <ul className="requirements-list">
        {why.map((w) => {
          const { text: labelText, detail: labelDetail } = splitLabel(w.label);
          return (
          <li key={w.label} className="req-item">
            <div className="req-left">
              <span className="req-label" title={labelDetail}>
                <span className={`req-status-dot ${w.met ? "met" : "unmet"}`} />
                {labelText}
              </span>
              {w.label.toLowerCase().includes("days worked") && (
                <div className="progress-bar-wrap">
                  <div
                    className={`progress-fill ${w.met ? "met" : "unmet"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              )}
            </div>
            <span className="req-values">
              <strong>{fmt(w.actual)}</strong> / {fmt(w.required)}
            </span>
          </li>
          );
        })}
      </ul>

      {/* Actionable Next Step */}
      {nextStep && (
        <div className="next-action">
          <svg className="action-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 3 11 8 6 13" />
          </svg>
          <div>
            <strong style={{ color: "var(--paper)" }}>Next Step: </strong>
            <span>{nextStep}</span>
          </div>
        </div>
      )}

      {/* Vernacular Bedrock Explanation */}
      <div className="explanation-section">
        <div className="explanation-header">
          <span className="explanation-badge">Plain-Language Summary</span>
          <span className="bedrock-pill">Bedrock Nova Lite · Grounded</span>
        </div>

        {explaining ? (
          <div className="skeleton-box" aria-label="Synthesizing explanation">
            <div className="skeleton-bar" style={{ width: "100%" }} />
            <div className="skeleton-bar" style={{ width: "85%" }} />
            <div className="skeleton-bar" style={{ width: "60%" }} />
          </div>
        ) : (
          <p className="explanation-body">{explanation ?? "—"}</p>
        )}
      </div>
    </section>
  );
}
