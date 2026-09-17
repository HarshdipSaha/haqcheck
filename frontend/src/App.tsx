import { useState, useEffect } from "react";
import { evaluate, explain, ApiError } from "./api";
import { FactsForm, DEMO_CASE_1 } from "./components/FactsForm";
import { VerdictCard } from "./components/VerdictCard";
import { JurisdictionToggle } from "./components/JurisdictionToggle";
import { RulebookDrawer } from "./components/RulebookDrawer";
import { Footer } from "./components/Footer";
import { evaluateWhy, nextStepFor } from "./requirements";
import type { EvaluateResponse, Facts, Jurisdiction, Language, Verdict } from "./types";
import "./styles.css";

export default function App() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("karnataka");
  const [facts, setFacts] = useState<Facts>(DEMO_CASE_1);
  const [resp, setResp] = useState<EvaluateResponse | null>(null);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explaining, setExplaining] = useState(false);

  async function fetchExplanations(next: EvaluateResponse, f: Facts, lang: Language) {
    setExplaining(true);
    setExplanations({});
    try {
      const items = next.results.map((r) => ({
        benefitId: r.benefitId,
        verdict: r.verdict,
        cited: r.cited,
        why: evaluateWhy(r.benefitId, f),
        nextStep: nextStepFor(r.benefitId, r.verdict),
      }));
      const { explanations } = await explain(items, lang);
      setExplanations(explanations);
    } catch {
      setExplanations(
        Object.fromEntries(
          next.results.map((r) => [
            r.benefitId,
            "Explanation unavailable; the statutory decision above is unaffected.",
          ])
        )
      );
    } finally {
      setExplaining(false);
    }
  }

  async function run(f: Facts, j: Jurisdiction) {
    setBusy(true);
    setErrors({});
    try {
      const next = await evaluate(f, j);
      const prev = new Map<string, Verdict>(
        resp?.results.map((r) => [r.benefitId, r.verdict] as const)
      );
      setChanged(
        new Set(
          next.results
            .filter((r) => prev.size > 0 && prev.get(r.benefitId) !== r.verdict)
            .map((r) => r.benefitId)
        )
      );
      setResp(next);
      setFacts(f);
      fetchExplanations(next, f, language);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setErrors((e.body as { errors?: Record<string, string> }).errors ?? {});
      } else {
        alert("Rule engine unavailable. Try again. (We never fall back to a guess.)");
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run(DEMO_CASE_1, "karnataka");
  }, []);

  const highlight = resp?.results.flatMap((r) => r.cited.map((c) => c.id)) ?? [];

  return (
    <>
      {/* Sticky Header */}
      <header className="top">
        <div className="brand-group">
          <div className="brand-dot" />
          <div className="brand-titles">
            <span className="brand-name">HaqCheck</span>
            <span className="brand-sub">Cedar in Amazon Verified Permissions</span>
          </div>
        </div>

        <div className="top-controls">
          <JurisdictionToggle
            value={jurisdiction}
            disabled={busy}
            onChange={(j) => {
              setJurisdiction(j);
              if (facts) run(facts, j);
            }}
          />

          <select
            className="lang-select"
            value={language}
            aria-label="Explanation language"
            onChange={(e) => {
              const l = e.target.value as Language;
              setLanguage(l);
              if (resp && facts) fetchExplanations(resp, facts, l);
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
          </select>

          <button className="pill-btn" onClick={() => setDrawer(true)}>
            <span>Cedar Rules</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13L13 3M13 3H5M13 3V11" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-card">
          <div className="hero-meta">
            <span className="hero-pill">AWS Bharat Builds Tour 2026</span>
            <span className="label">Stop 01 First Commit</span>
          </div>

          <h1 className="hero-title">Appeal a citation, not a vibe.</h1>
          <p className="hero-desc">
            Social-security rules for India&apos;s gig workers are divided between the Central Rules 2026 (90-day threshold) and the Karnataka High Court order (platform welfare fee). HaqCheck evaluates eligibility through formal Cedar policies; the language model only translates.
          </p>

          <div className="hero-stats-row">
            <div className="stat-tag">
              <span className="stat-tag-label">Decision Engine</span>
              <span className="stat-tag-val">Cedar in AVP</span>
            </div>
            <div className="stat-tag">
              <span className="stat-tag-label">Language Model</span>
              <span className="stat-tag-val">Bedrock Nova Lite (Explain Only)</span>
            </div>
            <div className="stat-tag">
              <span className="stat-tag-label">Architecture</span>
              <span className="stat-tag-val">Serverless Scale-to-Zero</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <main className="layout">
        {/* Left Column: Form */}
        <FactsForm
          onSubmit={(f) => run(f, jurisdiction)}
          busy={busy}
          errors={errors}
        />

        {/* Right Column: Decisions */}
        <div className="results-column">
          {resp && (
            <div className="results-meta">
              <span className="active-rulebook-name">
                Rulebook: {resp.rulebookName}
              </span>
              <span className="avp-chip">
                <span className="avp-dot" />
                Version: {resp.rulesetVersion}
              </span>
            </div>
          )}

          {resp?.results.map((r) => (
            <VerdictCard
              key={r.benefitId}
              result={r}
              why={evaluateWhy(r.benefitId, facts)}
              nextStep={nextStepFor(r.benefitId, r.verdict)}
              explanation={explanations[r.benefitId]}
              explaining={explaining}
              changed={changed.has(r.benefitId)}
            />
          ))}
        </div>
      </main>

      {/* Cedar Rulebook Drawer */}
      <RulebookDrawer
        jurisdiction={jurisdiction}
        highlightIds={highlight}
        open={drawer}
        onClose={() => setDrawer(false)}
      />

      {/* Footer */}
      <Footer version={resp?.rulesetVersion} />
    </>
  );
}
