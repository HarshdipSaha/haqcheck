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
      // spec §9: the decision card is unaffected if LLM explanation fails
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

  // Initial run on mount with demo case 1 so the page loads with active results
  useEffect(() => {
    run(DEMO_CASE_1, "karnataka");
  }, []);

  const highlight = resp?.results.flatMap((r) => r.cited.map((c) => c.id)) ?? [];

  return (
    <>
      {/* Top Sticky Navigation */}
      <header className="top">
        <div className="brand-group">
          <div className="brand-icon">⚖️</div>
          <div className="brand-titles">
            <h1>HaqCheck</h1>
            <span className="tagline">Your Haq, Cited · Cedar in Amazon Verified Permissions</span>
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
            <option value="en">🌐 English</option>
            <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            <option value="kn">🟡🔴 ಕನ್ನಡ (Kannada)</option>
          </select>

          <button className="ghost" onClick={() => setDrawer(true)}>
            <span>{"</>"}</span> View Cedar Rules
          </button>
        </div>
      </header>

      {/* Hero Explainer Banner */}
      <section className="hero-banner">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">AWS Bharat Builds Tour 2026 · Stop 01 "First Commit"</div>
            <h2 className="hero-title">Appeal a citation, not a vibe.</h2>
            <p className="hero-desc">
              India&apos;s Social Security Rules 2026 (90-day threshold) and Karnataka High Court orders
              (platform welfare cess) are in active conflict. HaqCheck uses Cedar to evaluate your statutory
              rights deterministically, while Amazon Bedrock translates and explains.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-chip">
              <span>Decision Engine</span>
              <strong>Cedar (AVP)</strong>
            </div>
            <div className="stat-chip">
              <span>LLM Role</span>
              <strong>Explain Only</strong>
            </div>
            <div className="stat-chip">
              <span>Cloud Cost</span>
              <strong>$0.00 / Zero</strong>
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

        {/* Right Column: Results */}
        <div className="results-column">
          {resp && (
            <div className="results-meta-bar">
              <span className="ruleset-tag">
                📚 Active Rulebook: {resp.rulebookName}
              </span>
              <span className="engine-indicator">
                <span className="engine-dot" />
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

      {/* Slide-over Cedar Rulebook Drawer */}
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
