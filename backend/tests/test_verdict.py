import pytest
from haqcheck.verdict import map_verdict, ELIGIBLE, NOT_ELIGIBLE, NOT_APPLICABLE, UnknownPolicyId

POLICY_MAP = {
    "AVP1": {"id": "IN-SSR2026-90day", "source": "Rules 2026 rule 5", "confidence": "primary", "effect": "permit", "file": "common/central_90day.cedar"},
    "AVP2": {"id": "KA-HC-2026-cess-scope", "source": "KA HC para 12", "confidence": "primary", "effect": "permit", "file": "karnataka/ka_cess_scope.cedar"},
    "AVP3": {"id": "KA-HC-2026-out-of-state", "source": "KA HC scope", "confidence": "primary", "effect": "forbid", "file": "karnataka/ka_out_of_state.cedar"},
}
MANIFEST = ["central_social_security", "ka_welfare_fund"]


def test_benefit_outside_manifest_is_not_applicable_without_avp():
    r = map_verdict("ka_welfare_fund", ["central_social_security"], None, POLICY_MAP, "central")
    assert r["verdict"] == NOT_APPLICABLE
    assert r["avpPolicyIds"] == []
    assert r["cited"][0]["id"] == "manifest:central"
    assert "central" in r["cited"][0]["source"]


def test_allow_is_eligible_with_permit_citation():
    resp = {"decision": "ALLOW", "determiningPolicies": [{"policyId": "AVP1"}]}
    r = map_verdict("central_social_security", MANIFEST, resp, POLICY_MAP, "karnataka")
    assert r["verdict"] == ELIGIBLE
    assert r["avpPolicyIds"] == ["AVP1"]
    assert r["cited"] == [POLICY_MAP["AVP1"]]


def test_deny_with_forbid_is_not_applicable_citing_forbid():
    resp = {"decision": "DENY", "determiningPolicies": [{"policyId": "AVP3"}]}
    r = map_verdict("ka_welfare_fund", MANIFEST, resp, POLICY_MAP, "karnataka")
    assert r["verdict"] == NOT_APPLICABLE
    assert r["cited"][0]["id"] == "KA-HC-2026-out-of-state"


def test_deny_with_no_determining_policies_is_not_eligible_uncited():
    resp = {"decision": "DENY", "determiningPolicies": []}
    r = map_verdict("central_social_security", MANIFEST, resp, POLICY_MAP, "karnataka")
    assert r["verdict"] == NOT_ELIGIBLE
    assert r["cited"] == []


def test_unknown_avp_policy_id_raises():
    resp = {"decision": "ALLOW", "determiningPolicies": [{"policyId": "STALE"}]}
    with pytest.raises(UnknownPolicyId):
        map_verdict("central_social_security", MANIFEST, resp, POLICY_MAP, "karnataka")
