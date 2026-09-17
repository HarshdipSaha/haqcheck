from __future__ import annotations

import os
import time
import uuid

import boto3

from haqcheck import rulesets
from haqcheck.avp import is_authorized
from haqcheck.facts import ValidationError, validate_facts
from haqcheck.http import parse_body, respond
from haqcheck.verdict import UnknownPolicyId, map_verdict

RULEBOOKS = ("central", "karnataka")
BENEFITS = ("central_social_security", "ka_welfare_fund")
CASE_TTL_SECONDS = 30 * 24 * 3600

_clients: dict = {}


def _avp():
    if "avp" not in _clients:
        _clients["avp"] = boto3.client("verifiedpermissions", region_name=os.environ.get("AVP_REGION"))
    return _clients["avp"]


def _table():
    if "table" not in _clients:
        _clients["table"] = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
    return _clients["table"]


def _evaluate_all(book: dict, case_id: str, facts: dict) -> list[dict]:
    results = []
    for benefit in BENEFITS:
        resp = None
        if benefit in book["manifest"]:
            resp = is_authorized(_avp(), book["policyStoreId"], case_id, facts, benefit)
        results.append(map_verdict(benefit, book["manifest"], resp, book["policyMap"], book["rulebook"]))
    return results


def lambda_handler(event, context):
    try:
        body = parse_body(event)
    except ValueError:
        return respond(400, {"error": "invalid_json"})

    jurisdiction = body.get("jurisdiction")
    if jurisdiction not in RULEBOOKS:
        return respond(400, {"error": "bad_jurisdiction", "errors": {"jurisdiction": f"must be one of {list(RULEBOOKS)}"}})
    try:
        facts = validate_facts(body.get("facts") or {})
    except ValidationError as e:
        return respond(400, {"error": "invalid_facts", "errors": e.errors})

    case_id = uuid.uuid4().hex
    try:
        book = rulesets.load(jurisdiction)
        try:
            results = _evaluate_all(book, case_id, facts)
        except UnknownPolicyId:
            book = rulesets.load(jurisdiction, force=True)   # policy map rotated by a resync
            results = _evaluate_all(book, case_id, facts)
    except UnknownPolicyId:
        return respond(502, {"error": "engine_unavailable", "detail": "stale policy map"})
    except Exception as e:  # AVP down, throttled, store missing: never fall back to an LLM
        print(f"engine error: {e!r}")
        return respond(502, {"error": "engine_unavailable"})

    now = int(time.time())
    try:
        _table().put_item(Item={
            "PK": f"CASE#{case_id}", "SK": "v1", "facts": facts, "jurisdiction": jurisdiction,
            "rulesetVersion": book["version"], "results": results, "createdAt": now, "ttl": now + CASE_TTL_SECONDS,
        })
    except Exception as e:  # case log is not on the critical path
        print(f"case log failed: {e!r}")

    return respond(200, {
        "caseId": case_id, "rulebook": jurisdiction, "rulebookName": book["displayName"],
        "rulesetVersion": book["version"], "results": results,
    })
