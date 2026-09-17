"""Load RULESET#<rulebook>/CURRENT (store id, manifest, policy map). Cached per Lambda container.

Fallback: a bundled policies/build/<rb>.policy_map.json copied into the deployment package
(see `sam build` step in Task 9), used only if DynamoDB has no CURRENT item.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import boto3

_CACHE: dict[str, dict] = {}
_BUNDLED = Path(__file__).resolve().parent / "bundled"


def _table():
    return boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def load(rulebook: str, force: bool = False) -> dict:
    if not force and rulebook in _CACHE:
        return _CACHE[rulebook]
    item = _table().get_item(Key={"PK": f"RULESET#{rulebook}", "SK": "CURRENT"}).get("Item")
    if item is None:
        bundled = _BUNDLED / f"{rulebook}.policy_map.json"
        if not bundled.exists():
            raise RuntimeError(f"no RULESET#{rulebook} CURRENT item and no bundled map")
        item = json.loads(bundled.read_text())
    book = {
        "rulebook": rulebook,
        "policyStoreId": item["policyStoreId"],
        "manifest": list(item["manifest"]),
        "displayName": item.get("displayName", rulebook),
        "policyMap": dict(item["policyMap"]),
        "version": str(item["version"]),
    }
    _CACHE[rulebook] = book
    return book


def invalidate(rulebook: str) -> None:
    _CACHE.pop(rulebook, None)
