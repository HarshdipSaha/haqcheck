from haqcheck.explain import build_prompt, digits_ok, explain_results

RESULT = {
    "benefitId": "central_social_security", "verdict": "Not eligible",
    "cited": [], "why": [{"label": "Days worked in the last 12 months", "met": False, "actual": 73, "required": 90},
                         {"label": "Registered on e-Shram", "met": True, "actual": True, "required": True}],
    "nextStep": "Keep working and re-check after 90 days.",
}
ELIGIBLE = {
    "benefitId": "ka_welfare_fund", "verdict": "Eligible",
    "cited": [{"id": "KA-HC-2026-cess-scope", "source": "Karnataka HC order, 4 July 2026, para 12", "confidence": "primary", "effect": "permit", "file": "karnataka/ka_cess_scope.cedar"}],
    "why": [{"label": "Working in Karnataka", "met": True, "actual": "KA", "required": "KA"}],
    "nextStep": "Register with the welfare board.",
}
NOT_APPLICABLE = {
    "benefitId": "ka_welfare_fund", "verdict": "Not applicable",
    "cited": [{"id": "KA-HC-2026-out-of-state", "source": "Karnataka HC order: Karnataka only", "confidence": "primary", "effect": "forbid", "file": "karnataka/ka_out_of_state.cedar"}],
    "why": [{"label": "Working in Karnataka", "met": False, "actual": "MH", "required": "KA"}],
    "nextStep": "The Karnataka fund covers workers engaged in Karnataka only.",
}


def test_guardrail_on_three_fixtures():
    assert digits_ok("Eligible under the 4 July 2026 order, para 12.", ELIGIBLE)
    assert not digits_ok("Eligible; you get 500 rupees.", ELIGIBLE)
    assert digits_ok("Not applicable: you work in MH, the fund is for KA.", NOT_APPLICABLE)


def test_devanagari_digits_are_normalised_before_check():
    assert digits_ok("आपने ९० में से ७३ दिन काम किया।", RESULT)


def test_prompt_contains_only_given_facts():
    p = build_prompt(RESULT, "hi")
    assert "73" in p and "90" in p
    assert "Not eligible" in p
    assert "Hindi" in p


def test_digits_ok_rejects_new_numbers():
    assert digits_ok("You have 73 of 90 days.", RESULT)
    assert not digits_ok("You need 120 days.", RESULT)


def test_explain_results_uses_fallback_when_model_hallucinates_numbers():
    out = explain_results([RESULT], "en", run_model=lambda prompt: "You need 120 days and 5 years.")
    assert out["central_social_security"].startswith("Not eligible")
    assert "120" not in out["central_social_security"]


def test_explain_results_returns_model_text_when_clean():
    out = explain_results([RESULT], "en", run_model=lambda prompt: "You have worked 73 of the 90 days needed.")
    assert out["central_social_security"] == "You have worked 73 of the 90 days needed."
