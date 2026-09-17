from __future__ import annotations

STATES = {"AP", "AR", "AS", "BR", "CG", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", "MH", "MN",
          "ML", "MZ", "NL", "OD", "PB", "RJ", "SK", "TN", "TS", "TR", "UP", "UK", "WB",
          "AN", "CH", "DN", "DL", "JK", "LA", "LD", "PY"}
VEHICLES = {"bicycle", "two_wheeler", "three_wheeler", "four_wheeler", "none"}
BENEFIT_NAMES = {
    "central_social_security": "Central social security (Social Security Rules 2026)",
    "ka_welfare_fund": "Karnataka platform-worker welfare fund",
}


class ValidationError(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("invalid facts")
        self.errors = errors


def validate_facts(raw: dict) -> dict:
    errors: dict[str, str] = {}
    out: dict = {}

    state = str(raw.get("state", "")).strip().upper()
    if state not in STATES:
        errors["state"] = "unknown state code"
    out["state"] = state

    days = raw.get("daysWorkedLast12m")
    if not isinstance(days, int) or isinstance(days, bool) or not (0 <= days <= 366):
        errors["daysWorkedLast12m"] = "must be an integer between 0 and 366"
    out["daysWorkedLast12m"] = days

    reg = raw.get("eshramRegistered")
    if not isinstance(reg, bool):
        errors["eshramRegistered"] = "must be true or false"
    out["eshramRegistered"] = reg

    platforms = raw.get("platforms")
    if not isinstance(platforms, list) or not all(isinstance(p, str) for p in platforms):
        errors["platforms"] = "must be a list of platform names"
        out["platforms"] = []
    else:
        out["platforms"] = sorted({p.strip().lower() for p in platforms if p.strip()})

    vehicle = str(raw.get("vehicle", "")).strip().lower()
    if vehicle not in VEHICLES:
        errors["vehicle"] = f"must be one of {sorted(VEHICLES)}"
    out["vehicle"] = vehicle

    age = raw.get("age")
    if not isinstance(age, int) or isinstance(age, bool) or not (18 <= age <= 80):
        errors["age"] = "must be an integer between 18 and 80"
    out["age"] = age

    if errors:
        raise ValidationError(errors)
    return out


def build_entities(case_id: str, facts: dict, benefit_id: str) -> list[dict]:
    """Inline entities for IsAuthorized. Nothing is stored in AVP (spec §6.1)."""
    worker = {
        "identifier": {"entityType": "HaqCheck::Worker", "entityId": case_id},
        "attributes": {
            "state": {"string": facts["state"]},
            "daysWorkedLast12m": {"long": facts["daysWorkedLast12m"]},
            "eshramRegistered": {"boolean": facts["eshramRegistered"]},
            "platforms": {"set": [{"string": p} for p in facts["platforms"]]},
            "vehicle": {"string": facts["vehicle"]},
            "age": {"long": facts["age"]},
        },
        "parents": [],
    }
    benefit = {
        "identifier": {"entityType": "HaqCheck::Benefit", "entityId": benefit_id},
        "attributes": {"name": {"string": BENEFIT_NAMES.get(benefit_id, benefit_id)}},
        "parents": [],
    }
    return [worker, benefit]
