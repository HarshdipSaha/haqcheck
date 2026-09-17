"""Evaluate policies/tests/cases.json against the live AVP stores, using the same code the Lambda uses."""
import json
import sys
from pathlib import Path

import boto3

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend" / "src"))

from haqcheck.avp import is_authorized  # noqa: E402
from haqcheck.facts import validate_facts  # noqa: E402
from haqcheck.verdict import map_verdict  # noqa: E402

POL = ROOT / "policies"
BUILD = POL / "build"


def load_rulebook(rb: str) -> dict:
    return json.loads((BUILD / f"{rb}.policy_map.json").read_text())


def main() -> int:
    stores = json.loads((BUILD / "stores.json").read_text())
    avp = boto3.client("verifiedpermissions", region_name=stores["region"])
    books = {rb: load_rulebook(rb) for rb in ("central", "karnataka")}

    # Sanity: policy count in AVP equals policy map size (catches a half-failed sync)
    for rb, book in books.items():
        live = avp.list_policies(policyStoreId=book["policyStoreId"]).get("policies", [])
        if len(live) != len(book["policyMap"]):
            print(f"FAIL [{rb}] store has {len(live)} policies, map has {len(book['policyMap'])}. Re-run sync.")
            return 1

    cases = json.loads((POL / "tests" / "cases.json").read_text())
    failures = 0
    for i, case in enumerate(cases):
        book = books[case["jurisdiction"]]
        facts = validate_facts(case["facts"])
        for benefit, exp in case["expected"].items():
            resp = None
            if benefit in book["manifest"]:
                resp = is_authorized(avp, book["policyStoreId"], f"test-{i}", facts, benefit)
            got = map_verdict(benefit, book["manifest"], resp, book["policyMap"], case["jurisdiction"])
            got_cited = [c["id"] for c in got["cited"]]
            ok = got["verdict"] == exp["verdict"] and got_cited == exp["cited"]
            print(f"{'ok  ' if ok else 'FAIL'} {case['name']} / {benefit}: {got['verdict']} {got_cited}")
            if not ok:
                failures += 1
                print(f"      expected {exp['verdict']} {exp['cited']}")
    print(f"\n{len(cases)} cases, {failures} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
