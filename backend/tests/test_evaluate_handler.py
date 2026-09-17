import json
import pytest

import handlers.evaluate as h
from haqcheck.verdict import UnknownPolicyId

BOOK = {
    "rulebook": "karnataka", "policyStoreId": "store-ka", "version": "v1", "displayName": "Karnataka",
    "manifest": ["central_social_security", "ka_welfare_fund"],
    "policyMap": {
        "P1": {"id": "IN-SSR2026-90day", "source": "s", "confidence": "primary", "effect": "permit", "file": "f"},
        "P2": {"id": "KA-HC-2026-cess-scope", "source": "s", "confidence": "primary", "effect": "permit", "file": "f"},
    },
}
FACTS = {"state": "KA", "daysWorkedLast12m": 73, "eshramRegistered": True,
         "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 24}


class FakeAvp:
    def __init__(self, answers):
        self.answers = answers
        self.calls = []

    def is_authorized(self, **kw):
        self.calls.append(kw)
        return self.answers[kw["resource"]["entityId"]]


class FakeTable:
    def __init__(self):
        self.items = []

    def put_item(self, Item):
        self.items.append(Item)


@pytest.fixture
def wired(monkeypatch):
    avp = FakeAvp({
        "central_social_security": {"decision": "DENY", "determiningPolicies": []},
        "ka_welfare_fund": {"decision": "ALLOW", "determiningPolicies": [{"policyId": "P2"}]},
    })
    table = FakeTable()
    monkeypatch.setattr(h, "_avp", lambda: avp)
    monkeypatch.setattr(h, "_table", lambda: table)
    monkeypatch.setattr(h.rulesets, "load", lambda rb, force=False: BOOK)
    return avp, table


def _event(body):
    return {"body": json.dumps(body), "isBase64Encoded": False}


def test_happy_path_returns_two_results_and_logs_case(wired):
    avp, table = wired
    resp = h.lambda_handler(_event({"facts": FACTS, "jurisdiction": "karnataka"}), None)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    by_id = {r["benefitId"]: r for r in body["results"]}
    assert by_id["central_social_security"]["verdict"] == "Not eligible"
    assert by_id["ka_welfare_fund"]["verdict"] == "Eligible"
    assert by_id["ka_welfare_fund"]["cited"][0]["id"] == "KA-HC-2026-cess-scope"
    assert body["rulesetVersion"] == "v1" and body["rulebook"] == "karnataka"
    assert len(avp.calls) == 2
    assert table.items[0]["PK"].startswith("CASE#")
    assert table.items[0]["results"][1]["cited"][0]["id"] == "KA-HC-2026-cess-scope"


def test_bad_facts_return_400_with_field_errors(wired):
    resp = h.lambda_handler(_event({"facts": {**FACTS, "age": 5}, "jurisdiction": "karnataka"}), None)
    assert resp["statusCode"] == 400
    assert "age" in json.loads(resp["body"])["errors"]


def test_unknown_jurisdiction_is_400(wired):
    resp = h.lambda_handler(_event({"facts": FACTS, "jurisdiction": "mars"}), None)
    assert resp["statusCode"] == 400


def test_avp_failure_is_502_not_a_guess(wired, monkeypatch):
    avp, _ = wired
    def boom(**kw):
        raise RuntimeError("AVP down")
    monkeypatch.setattr(avp, "is_authorized", boom)
    resp = h.lambda_handler(_event({"facts": FACTS, "jurisdiction": "karnataka"}), None)
    assert resp["statusCode"] == 502
    assert json.loads(resp["body"])["error"] == "engine_unavailable"


def test_stale_policy_id_reloads_ruleset_once(wired, monkeypatch):
    avp, _ = wired
    avp.answers["ka_welfare_fund"] = {"decision": "ALLOW", "determiningPolicies": [{"policyId": "NEW"}]}
    loads = []
    fresh = {**BOOK, "policyMap": {**BOOK["policyMap"], "NEW": {"id": "KA-HC-2026-cess-scope", "source": "s", "confidence": "primary", "effect": "permit", "file": "f"}}}
    def load(rb, force=False):
        loads.append(force)
        return fresh if force else BOOK
    monkeypatch.setattr(h.rulesets, "load", load)
    resp = h.lambda_handler(_event({"facts": FACTS, "jurisdiction": "karnataka"}), None)
    assert resp["statusCode"] == 200
    assert loads == [False, True]
