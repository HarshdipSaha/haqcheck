from __future__ import annotations

from haqcheck.facts import build_entities


def is_authorized(client, store_id: str, case_id: str, facts: dict, benefit_id: str) -> dict:
    """One IsAuthorized call. Returns the raw AVP response (decision, determiningPolicies, errors)."""
    resp = client.is_authorized(
        policyStoreId=store_id,
        principal={"entityType": "HaqCheck::Worker", "entityId": case_id},
        action={"actionType": "HaqCheck::Action", "actionId": "claim"},
        resource={"entityType": "HaqCheck::Benefit", "entityId": benefit_id},
        entities={"entityList": build_entities(case_id, facts, benefit_id)},
    )
    if resp.get("errors"):
        raise RuntimeError(f"AVP evaluation errors: {resp['errors']}")
    return resp
