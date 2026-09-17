"""Push schema + policies to the AVP stores, emit the policy map, write RULESET# items.

Per rulebook:
  1. delete every existing policy in the store
  2. put_schema (shared schema)
  3. create each .cedar file listed by the manifest's policyDirs
  4. record avpPolicyId -> {id, source, confidence, effect, file} into policies/build/<rb>.policy_map.json
  5. write DynamoDB RULESET#<rb> / <version> and RULESET#<rb> / CURRENT
"""
import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path

import boto3

ROOT = Path(__file__).resolve().parents[2]
POL = ROOT / "policies"
BUILD = POL / "build"

ANNOT = re.compile(r'@(\w+)\("((?:[^"\\]|\\.)*)"\)')
EFFECT = re.compile(r'^\s*(permit|forbid)\s*\(', re.M)


def parse_policy(text: str) -> dict:
    meta = {k: v for k, v in ANNOT.findall(text)}
    m = EFFECT.search(text)
    if not m:
        raise ValueError("no permit/forbid found")
    for k in ("id", "source", "confidence"):
        if k not in meta:
            raise ValueError(f"missing @{k} annotation")
    return {"id": meta["id"], "source": meta["source"], "confidence": meta["confidence"], "effect": m.group(1)}


def git_sha() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT).decode().strip()
    except Exception:
        return "nogit"


def sync_rulebook(avp, ddb_table, rulebook: str, store_id: str, schema_json: str) -> None:
    manifest = json.loads((POL / "rulebooks" / f"{rulebook}.manifest.json").read_text())

    # Delete policies BEFORE updating the schema: a STRICT store validates existing policies
    # against a new schema, so a schema change could otherwise be rejected on resync.
    existing = avp.list_policies(policyStoreId=store_id).get("policies", [])
    for p in existing:
        avp.delete_policy(policyStoreId=store_id, policyId=p["policyId"])
    print(f"[{rulebook}] deleted {len(existing)} old policies")

    avp.put_schema(policyStoreId=store_id, definition={"cedarJson": schema_json})

    policy_map: dict[str, dict] = {}
    for d in manifest["policyDirs"]:
        for f in sorted((POL / d).glob("*.cedar")):
            text = f.read_text(encoding="utf-8")
            meta = parse_policy(text)
            resp = avp.create_policy(
                policyStoreId=store_id,
                definition={"static": {"description": meta["id"], "statement": text}},
            )
            rel = f.relative_to(POL).as_posix()
            policy_map[resp["policyId"]] = {**meta, "file": rel}
            print(f"[{rulebook}] {meta['effect']:6} {meta['id']:28} -> {resp['policyId']}")

    version = f"{git_sha()}-{int(time.time())}"
    BUILD.mkdir(exist_ok=True)
    (BUILD / f"{rulebook}.policy_map.json").write_text(json.dumps({
        "rulebook": rulebook, "policyStoreId": store_id, "version": version,
        "manifest": manifest["benefits"], "displayName": manifest["displayName"],
        "policyMap": policy_map,
    }, indent=2))

    if ddb_table is not None:
        item = {
            "policyStoreId": store_id, "gitSha": git_sha(), "publishedAt": int(time.time()),
            "manifest": manifest["benefits"], "displayName": manifest["displayName"],
            "policyMap": policy_map, "version": version,
        }
        ddb_table.put_item(Item={"PK": f"RULESET#{rulebook}", "SK": version, **item})
        ddb_table.put_item(Item={"PK": f"RULESET#{rulebook}", "SK": "CURRENT", **item})
        # fail loudly if CURRENT did not land (spec §9)
        check = ddb_table.get_item(Key={"PK": f"RULESET#{rulebook}", "SK": "CURRENT"}).get("Item")
        if not check or check.get("version") != version:
            raise SystemExit(f"[{rulebook}] RULESET# CURRENT not written correctly")
        print(f"[{rulebook}] RULESET# CURRENT -> {version}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rulebook", choices=["central", "karnataka", "all"], default="all")
    ap.add_argument("--table", default=os.environ.get("TABLE_NAME"), help="DynamoDB table; omit to skip writing RULESET#")
    ap.add_argument("--stack-region", default=os.environ.get("AWS_REGION", "ap-south-1"))
    args = ap.parse_args()

    stores = json.loads((BUILD / "stores.json").read_text())
    avp = boto3.client("verifiedpermissions", region_name=stores["region"])
    table = boto3.resource("dynamodb", region_name=args.stack_region).Table(args.table) if args.table else None
    schema_json = (POL / "schema.cedarschema.json").read_text()

    targets = ["central", "karnataka"] if args.rulebook == "all" else [args.rulebook]
    for rb in targets:
        sync_rulebook(avp, table, rb, stores["stores"][rb], schema_json)


if __name__ == "__main__":
    main()
