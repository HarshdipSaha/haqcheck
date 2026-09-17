import type { EvaluateResponse, ExplainItem, Facts, Jurisdiction, Language, Result } from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.body = body;
  }
}

// Local deterministic Cedar evaluator simulation for offline preview
function localEvaluate(facts: Facts, jurisdiction: Jurisdiction): EvaluateResponse {
  const NOTIFIED = ["zomato", "swiggy", "zepto", "urban_company"];
  const results: Result[] = [];

  // Central benefit
  const centralEligible = facts.eshramRegistered && facts.daysWorkedLast12m >= 90;
  results.push({
    benefitId: "central_social_security",
    verdict: centralEligible ? "Eligible" : "Not eligible",
    avpPolicyIds: centralEligible ? ["avp-local-central-permit"] : [],
    cited: centralEligible
      ? [{
          id: "IN-SSR2026-90day",
          source: "Social Security (Central) Rules, 2026 (gazetted 8 May 2026): a platform worker registered on e-Shram who has worked at least 90 days with an aggregator in the preceding 12 months is eligible for notified social-security benefits.",
          confidence: "secondary-source",
          effect: "permit",
          file: "common/central_90day.cedar",
        }]
      : [],
  });

  // Karnataka benefit
  if (jurisdiction === "central") {
    results.push({
      benefitId: "ka_welfare_fund",
      verdict: "Not applicable",
      avpPolicyIds: [],
      cited: [{
        id: "manifest:central",
        source: "The Karnataka Platform Welfare Fund is not covered by the Central rulebook. Switch to Karnataka jurisdiction to evaluate.",
        confidence: "primary",
        effect: "not_in_manifest",
        file: "rulebooks/central.manifest.json",
      }],
    });
  } else {
    // Karnataka rulebook
    if (facts.state !== "KA") {
      results.push({
        benefitId: "ka_welfare_fund",
        verdict: "Not applicable",
        avpPolicyIds: ["avp-local-ka-forbid"],
        cited: [{
          id: "KA-HC-2026-out-of-state",
          source: "Karnataka HC interim order (4 July 2026): welfare fund is restricted to platform gig workers operating within Karnataka state borders.",
          confidence: "secondary-source",
          effect: "forbid",
          file: "karnataka/ka_out_of_state.cedar",
        }],
      });
    } else {
      const onNotified = facts.platforms.some((p) => NOTIFIED.includes(p));
      results.push({
        benefitId: "ka_welfare_fund",
        verdict: onNotified ? "Eligible" : "Not eligible",
        avpPolicyIds: onNotified ? ["avp-local-ka-permit"] : [],
        cited: onNotified
          ? [{
              id: "KA-HC-2026-cess-scope",
              source: "Karnataka HC interim order (4 July 2026, IAMAI v. State): directed Swiggy, Zomato, Zepto, and Urban Company to deposit platform welfare fee for Karnataka gig workers.",
              confidence: "secondary-source",
              effect: "permit",
              file: "karnataka/ka_cess_scope.cedar",
            }]
          : [],
      });
    }
  }

  return {
    caseId: `local-${Date.now()}`,
    rulebook: jurisdiction,
    rulebookName: jurisdiction === "karnataka" ? "Karnataka Platform-Based Gig Workers Rules (Central + Overlay)" : "Social Security (Central) Rules, 2026",
    rulesetVersion: "git-dev-preview",
    results,
  };
}

function localExplain(items: ExplainItem[], language: Language): { explanations: Record<string, string> } {
  const explanations: Record<string, string> = {};

  for (const item of items) {
    if (item.benefitId === "central_social_security") {
      if (item.verdict === "Eligible") {
        if (language === "hi") {
          explanations[item.benefitId] = "केंद्रीय सामाजिक सुरक्षा नियम 2026 (IN-SSR2026-90day) के तहत आप पात्र हैं। आपने आवश्यक 90 दिन का कार्य पूरा कर लिया है और ई-श्रम पर पंजीकृत हैं। अपने ई-श्रम पोर्टल पर सामाजिक सुरक्षा लाभ के लिए आवेदन करें।";
        } else if (language === "kn") {
          explanations[item.benefitId] = "ಕೇಂದ್ರ ಸಾಮಾಜಿಕ ಭದ್ರತಾ ನಿಯಮಗಳು 2026 (IN-SSR2026-90day) ಅಡಿಯಲ್ಲಿ ನೀವು ಅರ್ಹರಾಗಿದ್ದೀರಿ. ನೀವು ಅಗತ್ಯವಿರುವ 90 ದಿನಗಳ ಕೆಲಸವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ ಮತ್ತು ಇ-ಶ್ರಮ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಿಕೊಂಡಿದ್ದೀರಿ.";
        } else {
          explanations[item.benefitId] = "Under the Social Security (Central) Rules 2026 (rule IN-SSR2026-90day), you qualify for central social security benefits because you are e-Shram registered and have worked at least 90 days in the last 12 months.";
        }
      } else {
        if (language === "hi") {
          explanations[item.benefitId] = "आप अभी केंद्रीय लाभ के लिए पात्र नहीं हैं। नियम IN-SSR2026-90day के तहत पिछले 12 महीनों में कम से कम 90 दिन काम करना और ई-श्रम पर पंजीकरण अनिवार्य है।";
        } else if (language === "kn") {
          explanations[item.benefitId] = "ನೀವು ಇನ್ನೂ ಕೇಂದ್ರ ಸೌಲಭ್ಯಗಳಿಗೆ ಅರ್ಹರಾಗಿಲ್ಲ. ನಿಯಮ IN-SSR2026-90day ಪ್ರಕಾರ ಕಳೆದ 12 ತಿಂಗಳುಗಳಲ್ಲಿ ಕನಿಷ್ಠ 90 ದಿನಗಳ ಕೆಲಸ ಮತ್ತು ಇ-ಶ್ರಮ್ ನೋಂದಣಿ ಕಡ್ಡಾಯವಾಗಿದೆ.";
        } else {
          explanations[item.benefitId] = "You do not qualify yet under rule IN-SSR2026-90day. Central benefits require 90 working days with an aggregator in the last 12 months and active e-Shram registration.";
        }
      }
    } else if (item.benefitId === "ka_welfare_fund") {
      if (item.verdict === "Eligible") {
        if (language === "hi") {
          explanations[item.benefitId] = "कर्नाटक उच्च न्यायालय के आदेश (KA-HC-2026-cess-scope) के अनुसार आप पात्र हैं। आप कर्नाटक में Zomato, Swiggy, Zepto या Urban Company के साथ सक्रिय रूप से काम कर रहे हैं।";
        } else if (language === "kn") {
          explanations[item.benefitId] = "ಕರ್ನಾಟಕ ಹೈಕೋರ್ಟ್ ಮಧ್ಯಂತರ ಆದೇಶದ (KA-HC-2026-cess-scope) ಪ್ರಕಾರ, ನೀವು ಕರ್ನಾಟಕ ರಾಜ್ಯ ಕಲ್ಯಾಣ ನಿಧಿಯ ಸೌಲಭ್ಯಕ್ಕೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.";
        } else {
          explanations[item.benefitId] = "Under the Karnataka High Court order (KA-HC-2026-cess-scope), you qualify for the Karnataka Platform Welfare Fund because you operate in Karnataka on a notified platform (Zomato, Swiggy, Zepto, or Urban Company).";
        }
      } else if (item.verdict === "Not applicable") {
        if (language === "hi") {
          explanations[item.benefitId] = "यह नियम आप पर लागू नहीं होता है। कर्नाटक कल्याण कोष विशेष रूप से कर्नाटक राज्य के भीतर काम करने वाले गिग वर्करों के लिए है (नियम KA-HC-2026-out-of-state)।";
        } else if (language === "kn") {
          explanations[item.benefitId] = "ಈ ನಿಯಮವು ನಿಮಗೆ ಅನ್ವಯಿಸುವುದಿಲ್ಲ. ಕರ್ನಾಟಕ ಕಲ್ಯಾಣ ನಿಧಿಯು ಕೇವಲ ಕರ್ನಾಟಕ ರಾಜ್ಯದಲ್ಲಿ ಕೆಲಸ ಮಾಡುವ ಗಿಗ್ ಕಾರ್ಮಿಕರಿಗೆ ಮಾತ್ರ ಸೀಮಿತವಾಗಿದೆ.";
        } else {
          explanations[item.benefitId] = "This benefit does not apply to your profile. The Karnataka welfare cess fund is restricted to gig workers operating within Karnataka state borders (rule KA-HC-2026-out-of-state).";
        }
      } else {
        if (language === "hi") {
          explanations[item.benefitId] = "आप कर्नाटक कोष के लिए पात्र नहीं हैं क्योंकि आप वर्तमान में किसी भी अधिसूचित प्लेटफॉर्म (Swiggy, Zomato, Zepto, Urban Company) पर कार्यरत नहीं हैं।";
        } else if (language === "kn") {
          explanations[item.benefitId] = "ನೀವು ಯಾವುದೇ ಅಧಿಸೂಚಿತ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡದ ಕಾರಣ ಕರ್ನಾಟಕ ನಿಧಿಗೆ ಅರ್ಹರಾಗಿಲ್ಲ.";
        } else {
          explanations[item.benefitId] = "You are not eligible for the Karnataka fund because your platform is not among the notified aggregators (Swiggy, Zomato, Zepto, Urban Company) ordered by the court.";
        }
      }
    }
  }

  return { explanations };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!BASE) {
    if (path === "/evaluate") {
      const b = body as { facts: Facts; jurisdiction: Jurisdiction };
      return localEvaluate(b.facts, b.jurisdiction) as unknown as T;
    }
    if (path === "/explain") {
      const b = body as { results: ExplainItem[]; language: Language };
      return localExplain(b.results, b.language) as unknown as T;
    }
  }

  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(r.status, json);
    return json as T;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) throw err;
    console.warn(`AWS API at ${BASE || "(unset)"} unavailable, using local Cedar evaluator:`, err);
    if (path === "/evaluate") {
      const b = body as { facts: Facts; jurisdiction: Jurisdiction };
      return localEvaluate(b.facts, b.jurisdiction) as unknown as T;
    }
    if (path === "/explain") {
      const b = body as { results: ExplainItem[]; language: Language };
      return localExplain(b.results, b.language) as unknown as T;
    }
    throw err;
  }
}

export const evaluate = (facts: Facts, jurisdiction: Jurisdiction) =>
  post<EvaluateResponse>("/evaluate", { facts, jurisdiction });

export const explain = (results: ExplainItem[], language: Language) =>
  post<{ explanations: Record<string, string> }>("/explain", { results, language });
