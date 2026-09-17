import { useState } from "react";
import { evaluate, explain, ApiError } from "./api";
import { FactsForm } from "./components/FactsForm";
import { VerdictCard } from "./components/VerdictCard";
import { JurisdictionToggle } from "./components/JurisdictionToggle";
import { RulebookDrawer } from "./components/RulebookDrawer";
import { Footer } from "./components/Footer";
import { evaluateWhy, nextStepFor } from "./requirements";
import type { EvaluateResponse, Facts, Jurisdiction, Language, Verdict } from "./types";
import "./styles.css";

export default function App() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("karnataka");
  const [facts, setFacts] = useState<Facts | null>(null);
  const [resp, setResp] = useState<EvaluateResponse | null>(null);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explaining, setExplaining] = useState(false);

  async function fetchExplanations(next: EvaluateResponse, f: Facts, lang: Language) {
    setExplaining(true); setExplanations({});
    try {
      const items = next.results.map((r) => ({
        benefitId: r.benefitId, verdict: r.verdict, cited: r.cited,
        why: evaluateWhy(r.benefitId, f), nextStep: nextStepFor(r.benefitId, r.verdict),
      }));
      const { explanations } = await explain(items, lang);
      setExplanations(explanations);
    } catch {
      // spec §9: the decision card is unaffected
      setExplanations(Object.fromEntries(next.results.map((r) => [r.benefitId, "Explanation unavailable; the decision above is unaffected."])));
    } finally { setExplaining(false); }
  }

  async function run(f: Facts, j: Jurisdiction) {
    setBusy(true); setErrors({});
    try {
      const next = await evaluate(f, j);
      const prev = new Map<string, Verdict>(resp?.results.map((r) => [r.benefitId, r.verdict] as const));
      setChanged(new Set(next.results.filter((r) => prev.size && prev.get(r.benefitId) !== r.verdict).map((r) => r.benefitId)));
      setResp(next); setFacts(f);
      fetchExplanations(next, f, language);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) setErrors((e.body as { errors?: Record<string, string> }).errors ?? {});
      else alert("Rule engine unavailable. Try again. (We never fall back to a guess.)");
    } finally { setBusy(false); }
  }

  const highlight = resp?.results.flatMap((r) => r.cited.map((c) => c.id)) ?? [];

  return (
    <>
      <header className="top">
        <h1>HaqCheck <small>your haq, cited</small></h1>
        <JurisdictionToggle value={jurisdiction} disabled={busy}
          onChange={(j) => { setJurisdiction(j); if (facts) run(facts, j); }} />
        <select value={language} aria-label="Explanation language"
          onChange={(e) => { const l = e.target.value as Language; setLanguage(l); if (resp && facts) fetchExplanations(resp, facts, l); }}>
          <option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option>
        </select>
        <button className="ghost" onClick={() => setDrawer(true)}>View rulebook</button>
      </header>
      <main className="layout">
        <FactsForm onSubmit={(f) => run(f, jurisdiction)} busy={busy} errors={errors} />
        <div className="results">
          {resp && <p className="muted">Rulebook: {resp.rulebookName} · version {resp.rulesetVersion}</p>}
          {resp?.results.map((r) => (
            <VerdictCard key={r.benefitId} result={r} why={evaluateWhy(r.benefitId, facts!)}
              nextStep={nextStepFor(r.benefitId, r.verdict)}
              explanation={explanations[r.benefitId]} explaining={explaining}
              changed={changed.has(r.benefitId)} />
          ))}
        </div>
      </main>
      <RulebookDrawer jurisdiction={jurisdiction} highlightIds={highlight} open={drawer} onClose={() => setDrawer(false)} />
      <Footer version={resp?.rulesetVersion} />
    </>
  );
}
