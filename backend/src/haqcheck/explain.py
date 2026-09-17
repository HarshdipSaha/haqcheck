"""Grounded explanation. The model sees ONLY the verdict, cited rule text, why-list and nextStep.
A digit guardrail rejects any output that introduces numbers not present in the input."""
from __future__ import annotations

import json
import os
import re
from typing import Callable

LANG = {"en": "English", "hi": "Hindi (Devanagari script, Western numerals like 90 not ९०)", "kn": "Kannada"}

SYSTEM = (
    "You restate an eligibility result for an Indian gig worker in simple language. "
    "You are given the verdict, the exact rule that produced it, which requirements were met, and one next step. "
    "Do not add any rule, threshold, number, or advice that is not in the input. Do not speculate. "
    "Write 3 short sentences, then the next step as the last sentence. No headings, no bullet points."
)


def build_prompt(result: dict, language: str) -> str:
    return (
        f"Language: {LANG.get(language, 'English')}\n"
        f"Verdict: {result['verdict']}\n"
        f"Cited rules: {json.dumps(result.get('cited', []), ensure_ascii=False)}\n"
        f"Requirements: {json.dumps(result.get('why', []), ensure_ascii=False)}\n"
        f"Next step: {result.get('nextStep', '')}\n"
        "Write the explanation now."
    )


_DEVANAGARI = str.maketrans("०१२३४५६७८९", "0123456789")


def digits_ok(text: str, result: dict) -> bool:
    """Every number in the output must already appear in the input. Devanagari numerals are normalised first."""
    allowed = set(re.findall(r"[0-9]+", json.dumps(result, ensure_ascii=False)))
    produced = set(re.findall(r"[0-9]+", text.translate(_DEVANAGARI)))
    return produced <= allowed


def fallback(result: dict) -> str:
    parts = [result["verdict"] + "."]
    for w in result.get("why", []):
        parts.append(f"{w['label']}: {'met' if w['met'] else 'not met'} ({w['actual']} / {w['required']}).")
    if result.get("nextStep"):
        parts.append(result["nextStep"])
    return " ".join(parts)


def _strands_runner() -> Callable[[str], str]:
    from strands import Agent
    from strands.models import BedrockModel

    model = BedrockModel(
        model_id=os.environ.get("BEDROCK_MODEL_ID", "apac.amazon.nova-lite-v1:0"),
        region_name=os.environ.get("BEDROCK_REGION", "ap-south-1"),
        temperature=0.2,
        max_tokens=300,
    )

    def run(prompt: str) -> str:
        # A fresh Agent per call: Strands keeps conversation history on the instance, and we must not
        # let benefit A's "73 of 90 days" leak into benefit B's explanation (the guardrail would reject it).
        agent = Agent(model=model, system_prompt=SYSTEM, tools=[], callback_handler=None)
        return str(agent(prompt)).strip()
    return run


def explain_results(results: list[dict], language: str, run_model: Callable[[str], str] | None = None) -> dict[str, str]:
    run = run_model or _strands_runner()
    out: dict[str, str] = {}
    for r in results:
        try:
            text = run(build_prompt(r, language))
            out[r["benefitId"]] = text if text and digits_ok(text, r) else fallback(r)
        except Exception as e:
            print(f"explain failed for {r['benefitId']}: {e!r}")
            out[r["benefitId"]] = fallback(r)
    return out
