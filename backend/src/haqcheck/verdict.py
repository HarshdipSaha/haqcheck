"""Turn Verified Permissions' two-valued decision into HaqCheck's three-valued verdict.

Rules (spec §6.2):
  1. benefit not in manifest            -> NOT_APPLICABLE, cite the manifest, no AVP call
  2. ALLOW                              -> ELIGIBLE, cite the determining permit(s)
  3. DENY with a forbid among citations -> NOT_APPLICABLE, cite the forbid
  4. DENY with nothing determining      -> NOT_ELIGIBLE, no engine citation (UI uses requirements.json)
"""
from __future__ import annotations

ELIGIBLE = "Eligible"
NOT_ELIGIBLE = "Not eligible"
NOT_APPLICABLE = "Not applicable"


class UnknownPolicyId(Exception):
    """AVP returned a policy id that is not in our policy map (stale map after a resync)."""


def map_verdict(benefit_id: str, manifest: list[str], avp_response: dict | None,
                policy_map: dict[str, dict], rulebook: str) -> dict:
    if benefit_id not in manifest:
        return {
            "benefitId": benefit_id,
            "verdict": NOT_APPLICABLE,
            "avpPolicyIds": [],
            "cited": [{
                "id": f"manifest:{rulebook}",
                "source": f"Not covered by the {rulebook} rulebook",
                "confidence": "n/a",
                "effect": "manifest",
                "file": f"rulebooks/{rulebook}.manifest.json",
            }],
        }

    assert avp_response is not None, "avp_response required for benefits in the manifest"
    avp_ids = [p["policyId"] for p in avp_response.get("determiningPolicies", [])]
    missing = [i for i in avp_ids if i not in policy_map]
    if missing:
        raise UnknownPolicyId(missing)
    cited = [policy_map[i] for i in avp_ids]

    if avp_response["decision"] == "ALLOW":
        verdict = ELIGIBLE
    elif any(c["effect"] == "forbid" for c in cited):
        verdict = NOT_APPLICABLE
    else:
        verdict = NOT_ELIGIBLE

    return {"benefitId": benefit_id, "verdict": verdict, "avpPolicyIds": avp_ids, "cited": cited}
