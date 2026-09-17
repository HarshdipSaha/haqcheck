"""Create the two AVP policy stores ONCE. Store ids are stable for the event (spec §6.2 sync strategy)."""
import json
import os
import sys
from pathlib import Path

import boto3

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "policies" / "build"
RULEBOOKS = ["central", "karnataka"]


def main() -> None:
    region = os.environ.get("AVP_REGION", "ap-south-1")
    avp = boto3.client("verifiedpermissions", region_name=region)
    BUILD.mkdir(exist_ok=True)
    out_path = BUILD / "stores.json"
    if out_path.exists():
        print(f"{out_path} exists; refusing to create stores twice. Delete it only if the stores are gone.")
        sys.exit(1)
    stores = {}
    for rb in RULEBOOKS:
        resp = avp.create_policy_store(
            validationSettings={"mode": "STRICT"},
            description=f"HaqCheck {rb} rulebook",
        )
        stores[rb] = resp["policyStoreId"]
        print(f"created {rb}: {resp['policyStoreId']}")
    out_path.write_text(json.dumps({"region": region, "stores": stores}, indent=2))
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
