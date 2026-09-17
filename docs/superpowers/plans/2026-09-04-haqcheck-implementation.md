# HaqCheck Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship HaqCheck, a live web app where an Indian gig worker enters a few facts and gets, per welfare benefit, an Eligible / Not eligible / Not applicable verdict computed by Cedar in Amazon Verified Permissions, citing the exact rule, with a Bedrock-generated plain-language explanation that never decides anything.

**Architecture:** Static React frontend on Amplify Hosting calls two Python Lambdas behind an API Gateway HTTP API. `evaluate` consults a rulebook manifest, calls Verified Permissions `IsAuthorized` per benefit with inline entities, joins the returned opaque policy ids to `@id/@source` citations through a sync-time policy map, and logs the case in DynamoDB. `explain` wraps a Strands Agents SDK agent on Bedrock that restates the verdict and cited rule in English or Hindi. Cedar policies live in git and are pushed to two policy stores (central rulebook, Karnataka superset) by a sync script.

**Tech Stack:** Python 3.12, boto3 (`verifiedpermissions`, `dynamodb`, `bedrock-runtime`), Strands Agents SDK (`strands-agents`), AWS SAM CLI, Cedar (via Amazon Verified Permissions), DynamoDB on-demand, Amazon Bedrock (Amazon Nova Lite via the `apac.` inference profile by default, configurable), React 18/19 + Vite + TypeScript, Vitest, Amplify Hosting, pytest.

**Spec:** `docs/superpowers/specs/2026-09-04-haqcheck-design.md` (v3, approved). **Rules:** `HACKATHON_UNDERSTANDING.md`.

---

## Hard constraints from the hackathon rules (read before anything else)

1. **No project work before Thu 17 Sept 2026.** The repo, policies, and code must not exist before then. Repo history is audited. Task 0 below is *learning only* and produces no files in the project.
2. **Disclose AI coding tools** in the README (Task 15).
3. **Submission** = public repo + 2–3 min video + short writeup, through the stop's form, before the published deadline (check the schedule page on Sept 17 for the hour).
4. **Commit identity:** `Harshdip Saha <harshdipsaha@gmail.com>` (see Task 1).

## Day map

| Day | Tasks |
|---|---|
| Before Sept 17 (learning only) | Task 0 |
| Thu 17 | Tasks 1–6 (repo, policies, verdict lib, infra, stores + sync, policy tests). **Go/no-go at end of Task 6.** |
| Fri 18 | Tasks 7–10 (handlers, deploy + smoke test, frontend scaffold + form) |
| Sat 19 (Bangalore in-person day) | Tasks 11–14 (cards, toggle + drawer, explain + language, Amplify) |
| Sun 20 | Task 15 (rehearsal, README, video, submit). Task 16 only if everything is green by noon. |

---

## File structure (final)

```
haqcheck/
├── README.md
├── .gitignore
├── amplify.yml
├── policies/
│   ├── schema.cedarschema.json          # Cedar JSON schema, namespace HaqCheck (shared by both stores)
│   ├── common/
│   │   └── central_90day.cedar          # IN-SSR2026-90day (permit)
│   ├── karnataka/
│   │   ├── ka_cess_scope.cedar          # KA-HC-2026-cess-scope (permit)
│   │   └── ka_out_of_state.cedar        # KA-HC-2026-out-of-state (forbid)
│   ├── rulebooks/
│   │   ├── central.manifest.json
│   │   └── karnataka.manifest.json
│   ├── requirements.json                # human mirror of permit conditions + nextStep text
│   ├── tests/
│   │   └── cases.json                   # {facts, jurisdiction, expected verdict + cited ids}
│   └── build/                           # generated, gitignored: stores.json, *.policy_map.json
├── backend/
│   ├── template.yaml                    # SAM: HttpApi, 2 Lambdas, DynamoDB table, IAM
│   ├── samconfig.toml
│   ├── requirements-dev.txt
│   ├── src/
│   │   ├── requirements.txt             # boto3, strands-agents
│   │   ├── haqcheck/
│   │   │   ├── __init__.py
│   │   │   ├── facts.py                 # validate input, build AVP entity list
│   │   │   ├── verdict.py               # ALLOW/DENY + determiningPolicies → 3-valued verdict + citations
│   │   │   ├── avp.py                   # is_authorized request builder
│   │   │   ├── rulesets.py              # RULESET#/CURRENT loader with cache + bundled fallback
│   │   │   ├── explain.py               # grounded prompt, Strands agent, digit guardrail
│   │   │   └── http.py                  # JSON response helpers
│   │   └── handlers/
│   │       ├── __init__.py
│   │       ├── evaluate.py
│   │       └── explain.py
│   ├── scripts/
│   │   ├── create_stores.py             # run ONCE: two AVP stores → policies/build/stores.json
│   │   ├── sync_policies.py             # put schema, recreate policies, emit policy map, write RULESET#
│   │   └── run_tests.py                 # cases.json against live AVP via the Lambda's own mapping code
│   └── tests/
│       ├── conftest.py
│       ├── test_facts.py
│       ├── test_verdict.py
│       ├── test_evaluate_handler.py
│       └── test_explain.py
└── frontend/
    ├── package.json, vite.config.ts, tsconfig.json, index.html
    ├── scripts/copy-data.mjs            # copies requirements.json + .cedar texts into src/data
    ├── src/
    │   ├── main.tsx, App.tsx, styles.css
    │   ├── types.ts
    │   ├── api.ts                       # fetch wrappers for /evaluate and /explain
    │   ├── requirements.ts              # evaluateWhy(benefitId, facts)
    │   ├── requirements.test.ts
    │   ├── data/                        # generated by copy-data.mjs, gitignored
    │   └── components/
    │       ├── FactsForm.tsx
    │       ├── JurisdictionToggle.tsx
    │       ├── VerdictCard.tsx
    │       ├── RulebookDrawer.tsx
    │       └── Footer.tsx
    └── .env.example
```

---

## Task 0: Pre-event preparation (learning only, NO files in the project)

**Files:** none. Notes go in a personal notebook, not the repo.

- [ ] **Step 1: Confirm AWS service availability in the chosen region**

Run (any AWS account, any time before Sept 17):
```bash
aws verifiedpermissions list-policy-stores --region ap-south-1
aws bedrock list-foundation-models --region ap-south-1 --by-provider amazon \
  --query "modelSummaries[?contains(modelId,'nova-lite')].[modelId,inferenceTypesSupported]"
aws bedrock list-inference-profiles --region ap-south-1 --query "inferenceProfileSummaries[?contains(inferenceProfileId,'nova-lite')].inferenceProfileId"
```
Expected: first command returns `{"policyStores": []}` (service available). If Verified Permissions is not available in `ap-south-1`, note `us-east-1` as the AVP region (the plan has a separate `AVP_REGION` parameter for exactly this). For Bedrock: in Mumbai, Nova Lite is served through the **cross-region inference profile** `apac.amazon.nova-lite-v1:0`, not the bare model id (`ON_DEMAND` is typically absent from `inferenceTypesSupported` there). Write down the exact id the third command prints; the plan defaults to `apac.amazon.nova-lite-v1:0`. Also open Bedrock → Model access and enable Amazon Nova for the region.

- [ ] **Step 2: Redeem the $100 AWS credit code from the hackathon registration** in Billing → Credits.

- [ ] **Step 3: Read the two primary legal sources and write down clause references**

Find and read: (a) the Social Security (Central) Rules, 2026 text (rule number defining the minimum work-days threshold and e-Shram registration for gig/platform workers); (b) the Karnataka High Court order of July 2026 on the platform welfare cess (case number, date, paragraph listing the platforms and the Karnataka scope). Note the exact numbers. These replace the `<N>` placeholders in Task 2. If a primary text cannot be found, note the best secondary source; that rule ships with `@confidence("secondary-source")`.

- [ ] **Step 4: Learn Cedar on toy policies (not the project's rules)**

Open the Cedar playground (https://www.cedarpolicy.com/en/playground) and write three throwaway policies using: an attribute comparison in `when { }`, a `Set` with `.containsAny([...])`, and `forbid ... unless { }`. Confirm you understand that a firing `forbid` appears in "determining policies" and a no-match deny returns none.

- [ ] **Step 5: Install tooling on every team laptop**

`python 3.12`, `node 20+`, AWS CLI v2 (`aws configure` with an IAM user/role that has AdministratorAccess for the weekend), AWS SAM CLI (`sam --version`), `git`.

---

## Task 1: Repository and tooling (Thu 17 Sept, hour 0)

**Files:**
- Create: `haqcheck/.gitignore`, `haqcheck/README.md`, `haqcheck/backend/requirements-dev.txt`, `haqcheck/backend/src/requirements.txt`

- [ ] **Step 1: Create the repo (on or after Sept 17 only)**

```bash
mkdir haqcheck && cd haqcheck
git init -b main
git config user.name "Harshdip Saha"
git config user.email "harshdipsaha@gmail.com"
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# python
.venv/
__pycache__/
*.pyc
.pytest_cache/
# sam
backend/.aws-sam/
# generated
policies/build/
frontend/src/data/
# node
frontend/node_modules/
frontend/dist/
# env
.env
frontend/.env
```

- [ ] **Step 3: Write a stub `README.md`** (expanded in Task 15)

```markdown
# HaqCheck

Which welfare rule applies to you, decided by Cedar (Amazon Verified Permissions), cited to the clause. The LLM explains; it never decides.

Built for WeMakeDevs × AWS Bharat Builds Tour, Stop 01 "First Commit", 17–20 Sept 2026.
```

- [ ] **Step 4: Python dependency files**

`backend/src/requirements.txt`:
```
boto3>=1.35.0
strands-agents>=1.0.0
```

`backend/requirements-dev.txt`:
```
-r src/requirements.txt
pytest>=8.0
```

- [ ] **Step 5: Create the venv and install**

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
python -c "import boto3, strands; print(boto3.__version__)"
cd ..
```
Expected: prints a boto3 version with no import error.

- [ ] **Step 6: Commit**

```bash
git add .gitignore README.md backend/requirements-dev.txt backend/src/requirements.txt
git commit -m "chore: initialise HaqCheck repo and python deps"
```

---

## Task 2: Cedar schema, policies, manifests, requirements mirror

**Files:**
- Create: `policies/schema.cedarschema.json`, `policies/common/central_90day.cedar`, `policies/karnataka/ka_cess_scope.cedar`, `policies/karnataka/ka_out_of_state.cedar`, `policies/rulebooks/central.manifest.json`, `policies/rulebooks/karnataka.manifest.json`, `policies/requirements.json`

Replace every `<N>` / `<case no.>` with the values from Task 0 Step 3 before committing.

- [ ] **Step 1: Write the Cedar JSON schema**

`policies/schema.cedarschema.json`:
```json
{
  "HaqCheck": {
    "entityTypes": {
      "Worker": {
        "shape": {
          "type": "Record",
          "attributes": {
            "state": { "type": "String" },
            "daysWorkedLast12m": { "type": "Long" },
            "eshramRegistered": { "type": "Boolean" },
            "platforms": { "type": "Set", "element": { "type": "String" } },
            "vehicle": { "type": "String" },
            "age": { "type": "Long" }
          }
        }
      },
      "Benefit": {
        "shape": {
          "type": "Record",
          "attributes": {
            "name": { "type": "String" }
          }
        }
      }
    },
    "actions": {
      "claim": {
        "appliesTo": {
          "principalTypes": ["Worker"],
          "resourceTypes": ["Benefit"],
          "context": { "type": "Record", "attributes": {} }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Write the central rulebook policy**

`policies/common/central_90day.cedar`:
```cedar
@id("IN-SSR2026-90day")
@source("Social Security (Central) Rules 2026, rule <N>: a platform worker registered on e-Shram who has worked at least 90 days in the preceding 12 months is eligible for social-security coverage")
@confidence("primary")
permit(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"central_social_security"
) when {
  principal.eshramRegistered &&
  principal.daysWorkedLast12m >= 90
};
```

- [ ] **Step 3: Write the Karnataka overlay policies**

`policies/karnataka/ka_cess_scope.cedar`:
```cedar
@id("KA-HC-2026-cess-scope")
@source("Karnataka High Court order, <case no.>, 4 July 2026, para <N>: platforms Swiggy, Zomato, Zepto and Urban Company to deposit the per-ride welfare fee for workers engaged in Karnataka")
@confidence("primary")
permit(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"ka_welfare_fund"
) when {
  principal.state == "KA" &&
  principal.platforms.containsAny(["zomato", "swiggy", "zepto", "urban_company"])
};
```

`policies/karnataka/ka_out_of_state.cedar`:
```cedar
@id("KA-HC-2026-out-of-state")
@source("Karnataka High Court order, <case no.>, 4 July 2026: the welfare fund covers workers engaged in Karnataka only")
@confidence("primary")
// Redundant with the permit's state check on purpose: a firing forbid is
// returned in determiningPolicies, so the engine itself says "Not applicable"
// with a citation instead of the UI guessing.
forbid(
  principal,
  action == HaqCheck::Action::"claim",
  resource == HaqCheck::Benefit::"ka_welfare_fund"
) unless {
  principal.state == "KA"
};
```

- [ ] **Step 4: Write the manifests**

`policies/rulebooks/central.manifest.json`:
```json
{
  "rulebook": "central",
  "displayName": "Central (Social Security Rules 2026)",
  "policyDirs": ["common"],
  "benefits": ["central_social_security"]
}
```

`policies/rulebooks/karnataka.manifest.json`:
```json
{
  "rulebook": "karnataka",
  "displayName": "Karnataka (Central + Karnataka HC order)",
  "policyDirs": ["common", "karnataka"],
  "benefits": ["central_social_security", "ka_welfare_fund"]
}
```

- [ ] **Step 5: Write the requirements mirror**

`policies/requirements.json` (the frontend evaluates these for the "why" list; the explain prompt receives the result):
```json
{
  "benefits": {
    "central_social_security": {
      "name": "Central social security (Social Security Rules 2026)",
      "requirements": [
        { "policyId": "IN-SSR2026-90day", "label": "Registered on e-Shram", "field": "eshramRegistered", "op": "eq", "value": true },
        { "policyId": "IN-SSR2026-90day", "label": "Days worked in the last 12 months", "field": "daysWorkedLast12m", "op": "gte", "value": 90 }
      ],
      "nextStep": {
        "Eligible": "Log in to e-Shram and check that your platform has reported your work days; if not, raise a grievance on the e-Shram portal.",
        "Not eligible": "Keep working and keep your platform app records. Re-check once you cross 90 days in the last 12 months. Register on e-Shram now if you have not.",
        "Not applicable": "This rulebook does not cover this benefit."
      }
    },
    "ka_welfare_fund": {
      "name": "Karnataka platform-worker welfare fund",
      "requirements": [
        { "policyId": "KA-HC-2026-cess-scope", "label": "Working in Karnataka", "field": "state", "op": "eq", "value": "KA" },
        { "policyId": "KA-HC-2026-cess-scope", "label": "On a notified platform (Zomato, Swiggy, Zepto, Urban Company)", "field": "platforms", "op": "containsAny", "value": ["zomato", "swiggy", "zepto", "urban_company"] }
      ],
      "nextStep": {
        "Eligible": "Register with the Karnataka Platform-based Gig Workers Welfare Board and keep your platform ID handy; the fee is paid by the platform, not by you.",
        "Not eligible": "You are in Karnataka but not on a platform named in the order. Check the board's website for additions.",
        "Not applicable": "The Karnataka fund covers workers engaged in Karnataka only."
      }
    }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add policies
git commit -m "feat(policies): Cedar schema, central + Karnataka rulebooks, manifests, requirements mirror"
```

---

## Task 3: Verdict mapping and facts validation (pure Python, TDD)

**Files:**
- Create: `backend/src/haqcheck/__init__.py`, `backend/src/haqcheck/verdict.py`, `backend/src/haqcheck/facts.py`, `backend/tests/conftest.py`, `backend/tests/test_verdict.py`, `backend/tests/test_facts.py`

- [ ] **Step 1: conftest so tests can import `haqcheck`**

`backend/tests/conftest.py`:
```python
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))
```

`backend/src/haqcheck/__init__.py`: empty file.

- [ ] **Step 2: Write failing tests for verdict mapping**

`backend/tests/test_verdict.py`:
```python
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
```

- [ ] **Step 3: Run to verify failure**

```bash
cd backend && python -m pytest tests/test_verdict.py -v
```
Expected: FAIL, `ModuleNotFoundError: No module named 'haqcheck.verdict'`.

- [ ] **Step 4: Implement `verdict.py`**

`backend/src/haqcheck/verdict.py`:
```python
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
```

- [ ] **Step 5: Run to verify pass**

```bash
python -m pytest tests/test_verdict.py -v
```
Expected: 5 passed.

- [ ] **Step 6: Write failing tests for facts validation and entity building**

`backend/tests/test_facts.py`:
```python
import pytest
from haqcheck.facts import validate_facts, build_entities, ValidationError

GOOD = {"state": "KA", "daysWorkedLast12m": 73, "eshramRegistered": True,
        "platforms": ["zomato", "swiggy"], "vehicle": "two_wheeler", "age": 24}


def test_valid_facts_pass_through_normalised():
    f = validate_facts({**GOOD, "state": "ka", "platforms": ["Zomato", "swiggy"]})
    assert f["state"] == "KA"
    assert f["platforms"] == ["swiggy", "zomato"]   # lowercased, de-duplicated, sorted


@pytest.mark.parametrize("bad,field", [
    ({**GOOD, "daysWorkedLast12m": 400}, "daysWorkedLast12m"),
    ({**GOOD, "daysWorkedLast12m": -1}, "daysWorkedLast12m"),
    ({**GOOD, "age": 17}, "age"),
    ({**GOOD, "state": "XX"}, "state"),
    ({**GOOD, "vehicle": "rocket"}, "vehicle"),
    ({**GOOD, "eshramRegistered": "yes"}, "eshramRegistered"),
    ({k: v for k, v in GOOD.items() if k != "platforms"}, "platforms"),
])
def test_invalid_facts_report_field(bad, field):
    with pytest.raises(ValidationError) as e:
        validate_facts(bad)
    assert field in e.value.errors


def test_build_entities_shapes_avp_entity_list():
    ents = build_entities("case-1", GOOD, "ka_welfare_fund")
    worker = ents[0]
    assert worker["identifier"] == {"entityType": "HaqCheck::Worker", "entityId": "case-1"}
    assert worker["attributes"]["daysWorkedLast12m"] == {"long": 73}
    assert worker["attributes"]["eshramRegistered"] == {"boolean": True}
    assert worker["attributes"]["platforms"] == {"set": [{"string": "zomato"}, {"string": "swiggy"}]}
    benefit = ents[1]
    assert benefit["identifier"] == {"entityType": "HaqCheck::Benefit", "entityId": "ka_welfare_fund"}
    assert benefit["attributes"]["name"]["string"]
```

- [ ] **Step 7: Run to verify failure**

```bash
python -m pytest tests/test_facts.py -v
```
Expected: FAIL, `No module named 'haqcheck.facts'`.

- [ ] **Step 8: Implement `facts.py`**

`backend/src/haqcheck/facts.py`:
```python
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
```

Note: `validate_facts` normalises platforms to a sorted, de-duplicated, lowercase list (hence the sorted assertion in the first test). `build_entities` does not sort; it receives already-normalised facts from the handler, and the entity test passes `GOOD` through unchanged, so its `["zomato","swiggy"]` order assertion is correct as written.

- [ ] **Step 9: Run all tests**

```bash
python -m pytest -v
```
Expected: all passed (5 verdict + 9 facts).

- [ ] **Step 10: Commit**

```bash
cd .. && git add backend/src/haqcheck backend/tests
git commit -m "feat(backend): verdict mapping and facts validation with tests"
```

---

## Task 4: SAM infrastructure (table, HTTP API, two Lambda stubs) and first deploy

**Files:**
- Create: `backend/template.yaml`, `backend/samconfig.toml`, `backend/src/haqcheck/http.py`, `backend/src/handlers/__init__.py`, `backend/src/handlers/evaluate.py` (stub), `backend/src/handlers/explain.py` (stub)

- [ ] **Step 1: Write `template.yaml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: HaqCheck - Cedar-decided welfare eligibility with cited rules

Parameters:
  AvpRegion:
    Type: String
    Default: ap-south-1
    Description: Region of the Verified Permissions policy stores (may differ from the stack region)
  BedrockModelId:
    Type: String
    Default: apac.amazon.nova-lite-v1:0   # cross-region inference profile id; bare model id fails in ap-south-1
  BedrockRegion:
    Type: String
    Default: ap-south-1

Globals:
  Function:
    Runtime: python3.12
    Timeout: 20
    MemorySize: 512
    Architectures: [x86_64]
    Environment:
      Variables:
        TABLE_NAME: !Ref CasesTable
        AVP_REGION: !Ref AvpRegion
        BEDROCK_MODEL_ID: !Ref BedrockModelId
        BEDROCK_REGION: !Ref BedrockRegion

Resources:
  CasesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - { AttributeName: PK, AttributeType: S }
        - { AttributeName: SK, AttributeType: S }
      KeySchema:
        - { AttributeName: PK, KeyType: HASH }
        - { AttributeName: SK, KeyType: RANGE }
      TimeToLiveSpecification: { AttributeName: ttl, Enabled: true }

  Api:
    Type: AWS::Serverless::HttpApi
    Properties:
      CorsConfiguration:
        AllowOrigins: ['*']
        AllowMethods: [POST, OPTIONS]
        AllowHeaders: [content-type]

  EvaluateFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: handlers.evaluate.lambda_handler
      Policies:
        - DynamoDBCrudPolicy: { TableName: !Ref CasesTable }
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: [verifiedpermissions:IsAuthorized]
              Resource: '*'
      Events:
        Evaluate:
          Type: HttpApi
          Properties: { ApiId: !Ref Api, Path: /evaluate, Method: POST }

  ExplainFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: handlers.explain.lambda_handler
      Timeout: 30
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: [bedrock:InvokeModel, bedrock:InvokeModelWithResponseStream]
              Resource: '*'   # covers the inference profile and its destination-region model ARNs
      Events:
        Explain:
          Type: HttpApi
          Properties: { ApiId: !Ref Api, Path: /explain, Method: POST }

Outputs:
  ApiUrl:
    Value: !Sub 'https://${Api}.execute-api.${AWS::Region}.amazonaws.com'
  TableName:
    Value: !Ref CasesTable
```

- [ ] **Step 2: Write `samconfig.toml`**

```toml
version = 0.1
[default.global.parameters]
stack_name = "haqcheck"
region = "ap-south-1"
[default.build.parameters]
cached = true
parallel = true
[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = false
resolve_s3 = true
```

- [ ] **Step 3: JSON response helper**

`backend/src/haqcheck/http.py`:
```python
import json


def respond(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json", "access-control-allow-origin": "*"},
        "body": json.dumps(body, ensure_ascii=False),
    }


def parse_body(event: dict) -> dict:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        import base64
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw)
```

- [ ] **Step 4: Handler stubs** (real logic in Tasks 7 and 8)

`backend/src/handlers/__init__.py`: empty.

`backend/src/handlers/evaluate.py`:
```python
from haqcheck.http import respond


def lambda_handler(event, context):
    return respond(501, {"error": "not_implemented"})
```

`backend/src/handlers/explain.py`:
```python
from haqcheck.http import respond


def lambda_handler(event, context):
    return respond(501, {"error": "not_implemented"})
```

- [ ] **Step 5: Build and deploy**

```bash
cd backend
sam build
sam deploy
```
Expected: stack `haqcheck` CREATE_COMPLETE; Outputs show `ApiUrl` and `TableName`. Export both for the rest of the plan:
```bash
export API_URL=<ApiUrl output>      # PowerShell: $env:API_URL="..."
export TABLE_NAME=<TableName output> # PowerShell: $env:TABLE_NAME="..."
```

- [ ] **Step 6: Smoke the stub**

```bash
curl -s -X POST "$API_URL/evaluate" -H 'content-type: application/json' -d '{}'
```
Expected: `{"error": "not_implemented"}` with HTTP 501.

- [ ] **Step 7: Commit**

```bash
cd .. && git add backend/template.yaml backend/samconfig.toml backend/src
git commit -m "feat(infra): SAM stack with HTTP API, DynamoDB table and Lambda stubs"
```

---

## Task 5: Policy stores and the sync script

**Files:**
- Create: `backend/scripts/create_stores.py`, `backend/scripts/sync_policies.py`

- [ ] **Step 1: Write `create_stores.py` (run once for the whole event)**

```python
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
```

- [ ] **Step 2: Run it**

```bash
cd backend && python scripts/create_stores.py
```
Expected: two `created ...` lines and `policies/build/stores.json` written. Keep this file safe (it is gitignored); share it with teammates out-of-band.

- [ ] **Step 3: Write `sync_policies.py`**

```python
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
```

- [ ] **Step 4: Run the sync against both stores**

```bash
python scripts/sync_policies.py      # uses $TABLE_NAME exported in Task 4
```
Expected output shape:
```
[central] deleted 0 old policies
[central] permit IN-SSR2026-90day            -> SP...
[central] RULESET# CURRENT -> abc1234-1758100000
[karnataka] deleted 0 old policies
[karnataka] permit IN-SSR2026-90day            -> SP...
[karnataka] permit KA-HC-2026-cess-scope       -> SP...
[karnataka] forbid KA-HC-2026-out-of-state     -> SP...
[karnataka] RULESET# CURRENT -> ...
```
If `create_policy` fails with a validation error, the message names the line: fix the `.cedar` file or the schema and rerun. **This is the Day-1 go/no-go: if the rules cannot be expressed here by the evening, switch to the fallback in spec §14.**

- [ ] **Step 5: Confirm in the console** (AWS Console → Verified Permissions → each store → Policies) that the annotations are visible in the statements.

- [ ] **Step 6: Commit**

```bash
cd .. && git add backend/scripts/create_stores.py backend/scripts/sync_policies.py
git commit -m "feat(scripts): create AVP stores once; sync policies, policy map and RULESET# items"
```

---

## Task 6: Policy test cases against live AVP

**Files:**
- Create: `policies/tests/cases.json`, `backend/src/haqcheck/avp.py`, `backend/scripts/run_tests.py`

- [ ] **Step 1: Write the AVP request builder**

`backend/src/haqcheck/avp.py`:
```python
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
```

- [ ] **Step 2: Write the cases table**

`policies/tests/cases.json`:
```json
[
  {"name": "KA rider 73 days: KA fund yes, central not yet", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 73, "eshramRegistered": true, "platforms": ["zomato", "swiggy"], "vehicle": "two_wheeler", "age": 24},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []},
                "ka_welfare_fund": {"verdict": "Eligible", "cited": ["KA-HC-2026-cess-scope"]}}},

  {"name": "boundary 89 days", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 89, "eshramRegistered": true, "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 30},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []}}},

  {"name": "boundary 90 days", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 90, "eshramRegistered": true, "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 30},
   "expected": {"central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]}}},

  {"name": "boundary 91 days", "jurisdiction": "central",
   "facts": {"state": "KA", "daysWorkedLast12m": 91, "eshramRegistered": true, "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 30},
   "expected": {"central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]}}},

  {"name": "120 days but not on e-Shram", "jurisdiction": "central",
   "facts": {"state": "MH", "daysWorkedLast12m": 120, "eshramRegistered": false, "platforms": ["swiggy"], "vehicle": "bicycle", "age": 22},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []}}},

  {"name": "Pune rider 120 days under KA rulebook: central yes, KA fund not applicable (forbid)", "jurisdiction": "karnataka",
   "facts": {"state": "MH", "daysWorkedLast12m": 120, "eshramRegistered": true, "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 27},
   "expected": {"central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]},
                "ka_welfare_fund": {"verdict": "Not applicable", "cited": ["KA-HC-2026-out-of-state"]}}},

  {"name": "KA but non-notified platform", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 200, "eshramRegistered": true, "platforms": ["porter"], "vehicle": "three_wheeler", "age": 35},
   "expected": {"ka_welfare_fund": {"verdict": "Not eligible", "cited": []}}},

  {"name": "KA fund under central rulebook: outside manifest", "jurisdiction": "central",
   "facts": {"state": "KA", "daysWorkedLast12m": 73, "eshramRegistered": true, "platforms": ["zomato"], "vehicle": "two_wheeler", "age": 24},
   "expected": {"ka_welfare_fund": {"verdict": "Not applicable", "cited": ["manifest:central"]}}},

  {"name": "urban_company in KA", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 10, "eshramRegistered": false, "platforms": ["urban_company"], "vehicle": "none", "age": 40},
   "expected": {"ka_welfare_fund": {"verdict": "Eligible", "cited": ["KA-HC-2026-cess-scope"]},
                "central_social_security": {"verdict": "Not eligible", "cited": []}}},

  {"name": "zero days, registered", "jurisdiction": "central",
   "facts": {"state": "DL", "daysWorkedLast12m": 0, "eshramRegistered": true, "platforms": ["zepto"], "vehicle": "two_wheeler", "age": 19},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []}}},

  {"name": "366 days upper bound", "jurisdiction": "central",
   "facts": {"state": "TN", "daysWorkedLast12m": 366, "eshramRegistered": true, "platforms": ["swiggy"], "vehicle": "two_wheeler", "age": 50},
   "expected": {"central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]}}},

  {"name": "multiple platforms incl. notified", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 95, "eshramRegistered": true, "platforms": ["porter", "zepto"], "vehicle": "two_wheeler", "age": 29},
   "expected": {"ka_welfare_fund": {"verdict": "Eligible", "cited": ["KA-HC-2026-cess-scope"]},
                "central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]}}},

  {"name": "central rulebook boundary 89", "jurisdiction": "central",
   "facts": {"state": "UP", "daysWorkedLast12m": 89, "eshramRegistered": true, "platforms": ["swiggy"], "vehicle": "bicycle", "age": 21},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []}}},

  {"name": "central rulebook boundary 90", "jurisdiction": "central",
   "facts": {"state": "UP", "daysWorkedLast12m": 90, "eshramRegistered": true, "platforms": ["swiggy"], "vehicle": "bicycle", "age": 21},
   "expected": {"central_social_security": {"verdict": "Eligible", "cited": ["IN-SSR2026-90day"]}}},

  {"name": "KA rulebook, 100 days but not on e-Shram", "jurisdiction": "karnataka",
   "facts": {"state": "KA", "daysWorkedLast12m": 100, "eshramRegistered": false, "platforms": ["swiggy"], "vehicle": "two_wheeler", "age": 33},
   "expected": {"central_social_security": {"verdict": "Not eligible", "cited": []},
                "ka_welfare_fund": {"verdict": "Eligible", "cited": ["KA-HC-2026-cess-scope"]}}}
]
```
(15 cases: 8 under the Karnataka rulebook, 7 under Central. The spec's coverage list is met; see spec §10.)

- [ ] **Step 3: Write `run_tests.py`** (uses the Lambda's own mapping code)

```python
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
```

- [ ] **Step 4: Run it**

```bash
cd backend && python scripts/run_tests.py
```
Expected: every line starts with `ok`, final line `15 cases, 0 failures`. If a boundary case fails, the policy threshold is wrong; fix the `.cedar`, rerun `sync_policies.py`, rerun this.

- [ ] **Step 5: Go/no-go checkpoint (end of Day 1)**

All green here means Cedar expresses the rules and the engine cites them. Proceed. If not green by ~9pm on Sept 17, switch to spec §14.

- [ ] **Step 6: Commit**

```bash
cd .. && git add policies/tests backend/src/haqcheck/avp.py backend/scripts/run_tests.py
git commit -m "test(policies): 15 live AVP cases with expected verdicts and citations"
```

---

## Task 7: `evaluate` Lambda (TDD with a fake AVP client)

**Files:**
- Create: `backend/src/haqcheck/rulesets.py`, `backend/tests/test_evaluate_handler.py`
- Modify: `backend/src/handlers/evaluate.py`

- [ ] **Step 1: Write the ruleset loader**

`backend/src/haqcheck/rulesets.py`:
```python
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
```

- [ ] **Step 2: Write the failing handler test**

`backend/tests/test_evaluate_handler.py`:
```python
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
```

- [ ] **Step 3: Run to verify failure**

```bash
cd backend && python -m pytest tests/test_evaluate_handler.py -v
```
Expected: FAIL (`AttributeError: module has no attribute '_avp'` or similar).

- [ ] **Step 4: Implement the handler**

`backend/src/handlers/evaluate.py`:
```python
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
```

- [ ] **Step 5: Run to verify pass**

```bash
python -m pytest -v
```
Expected: all tests pass (previous 14 + 5 new).

- [ ] **Step 6: Commit**

```bash
cd .. && git add backend/src backend/tests/test_evaluate_handler.py
git commit -m "feat(evaluate): AVP-backed evaluate handler with manifest, citations, case log"
```

---

## Task 8: `explain` Lambda with Strands on Bedrock (TDD on the guardrail)

**Files:**
- Create: `backend/src/haqcheck/explain.py`, `backend/tests/test_explain.py`
- Modify: `backend/src/handlers/explain.py`

- [ ] **Step 1: Write failing tests for prompt building and guardrail**

`backend/tests/test_explain.py`:
```python
from haqcheck.explain import build_prompt, digits_ok, explain_results

RESULT = {
    "benefitId": "central_social_security", "verdict": "Not eligible",
    "cited": [], "why": [{"label": "Days worked in the last 12 months", "met": False, "actual": 73, "required": 90},
                         {"label": "Registered on e-Shram", "met": True, "actual": True, "required": True}],
    "nextStep": "Keep working and re-check after 90 days.",
}
ELIGIBLE = {
    "benefitId": "ka_welfare_fund", "verdict": "Eligible",
    "cited": [{"id": "KA-HC-2026-cess-scope", "source": "Karnataka HC order, 4 July 2026, para 12", "confidence": "primary", "effect": "permit", "file": "karnataka/ka_cess_scope.cedar"}],
    "why": [{"label": "Working in Karnataka", "met": True, "actual": "KA", "required": "KA"}],
    "nextStep": "Register with the welfare board.",
}
NOT_APPLICABLE = {
    "benefitId": "ka_welfare_fund", "verdict": "Not applicable",
    "cited": [{"id": "KA-HC-2026-out-of-state", "source": "Karnataka HC order: Karnataka only", "confidence": "primary", "effect": "forbid", "file": "karnataka/ka_out_of_state.cedar"}],
    "why": [{"label": "Working in Karnataka", "met": False, "actual": "MH", "required": "KA"}],
    "nextStep": "The Karnataka fund covers workers engaged in Karnataka only.",
}


def test_guardrail_on_three_fixtures():
    assert digits_ok("Eligible under the 4 July 2026 order, para 12.", ELIGIBLE)
    assert not digits_ok("Eligible; you get 500 rupees.", ELIGIBLE)
    assert digits_ok("Not applicable: you work in MH, the fund is for KA.", NOT_APPLICABLE)


def test_devanagari_digits_are_normalised_before_check():
    assert digits_ok("आपने ९० में से ७३ दिन काम किया।", RESULT)


def test_prompt_contains_only_given_facts():
    p = build_prompt(RESULT, "hi")
    assert "73" in p and "90" in p
    assert "Not eligible" in p
    assert "Hindi" in p


def test_digits_ok_rejects_new_numbers():
    assert digits_ok("You have 73 of 90 days.", RESULT)
    assert not digits_ok("You need 120 days.", RESULT)


def test_explain_results_uses_fallback_when_model_hallucinates_numbers():
    out = explain_results([RESULT], "en", run_model=lambda prompt: "You need 120 days and 5 years.")
    assert out["central_social_security"].startswith("Not eligible")
    assert "120" not in out["central_social_security"]


def test_explain_results_returns_model_text_when_clean():
    out = explain_results([RESULT], "en", run_model=lambda prompt: "You have worked 73 of the 90 days needed.")
    assert out["central_social_security"] == "You have worked 73 of the 90 days needed."
```

- [ ] **Step 2: Run to verify failure**

```bash
python -m pytest tests/test_explain.py -v
```
Expected: FAIL, `No module named 'haqcheck.explain'`.

- [ ] **Step 3: Implement `explain.py`**

`backend/src/haqcheck/explain.py`:
```python
"""Grounded explanation. The model sees ONLY the verdict, cited rule text, why-list and nextStep.
A digit guardrail rejects any output that introduces numbers not present in the input."""
from __future__ import annotations

import json
import os
import re
from typing import Callable

LANG = {"en": "English", "hi": "Hindi (Devanagari script, Western numerals like 90 not ९०)", "kn": "Kannada"}

SYSTEM = (
    "You restate an eligibility result for an Indian gig worker in simple language. "
    "You are given the verdict, the exact rule that produced it, which requirements were met, and one next step. "
    "Do not add any rule, threshold, number, or advice that is not in the input. Do not speculate. "
    "Write 3 short sentences, then the next step as the last sentence. No headings, no bullet points."
)


def build_prompt(result: dict, language: str) -> str:
    return (
        f"Language: {LANG.get(language, 'English')}\n"
        f"Verdict: {result['verdict']}\n"
        f"Cited rules: {json.dumps(result.get('cited', []), ensure_ascii=False)}\n"
        f"Requirements: {json.dumps(result.get('why', []), ensure_ascii=False)}\n"
        f"Next step: {result.get('nextStep', '')}\n"
        "Write the explanation now."
    )


_DEVANAGARI = str.maketrans("०१२३४५६७८९", "0123456789")


def digits_ok(text: str, result: dict) -> bool:
    """Every number in the output must already appear in the input. Devanagari numerals are normalised first."""
    allowed = set(re.findall(r"[0-9]+", json.dumps(result, ensure_ascii=False)))
    produced = set(re.findall(r"[0-9]+", text.translate(_DEVANAGARI)))
    return produced <= allowed


def fallback(result: dict) -> str:
    parts = [result["verdict"] + "."]
    for w in result.get("why", []):
        parts.append(f"{w['label']}: {'met' if w['met'] else 'not met'} ({w['actual']} / {w['required']}).")
    if result.get("nextStep"):
        parts.append(result["nextStep"])
    return " ".join(parts)


def _strands_runner() -> Callable[[str], str]:
    from strands import Agent
    from strands.models import BedrockModel

    model = BedrockModel(
        model_id=os.environ.get("BEDROCK_MODEL_ID", "apac.amazon.nova-lite-v1:0"),
        region_name=os.environ.get("BEDROCK_REGION", "ap-south-1"),
        temperature=0.2,
        max_tokens=300,
    )

    def run(prompt: str) -> str:
        # A fresh Agent per call: Strands keeps conversation history on the instance, and we must not
        # let benefit A's "73 of 90 days" leak into benefit B's explanation (the guardrail would reject it).
        agent = Agent(model=model, system_prompt=SYSTEM, tools=[], callback_handler=None)
        return str(agent(prompt)).strip()
    return run


def explain_results(results: list[dict], language: str, run_model: Callable[[str], str] | None = None) -> dict[str, str]:
    run = run_model or _strands_runner()
    out: dict[str, str] = {}
    for r in results:
        try:
            text = run(build_prompt(r, language))
            out[r["benefitId"]] = text if text and digits_ok(text, r) else fallback(r)
        except Exception as e:
            print(f"explain failed for {r['benefitId']}: {e!r}")
            out[r["benefitId"]] = fallback(r)
    return out
```

- [ ] **Step 4: Run to verify pass**

```bash
python -m pytest tests/test_explain.py -v
```
Expected: 6 passed.

- [ ] **Step 5: Wire the handler**

`backend/src/handlers/explain.py`:
```python
from haqcheck.explain import explain_results
from haqcheck.http import parse_body, respond

LANGS = {"en", "hi", "kn"}


def lambda_handler(event, context):
    try:
        body = parse_body(event)
    except ValueError:
        return respond(400, {"error": "invalid_json"})
    results = body.get("results")
    language = body.get("language", "en")
    if not isinstance(results, list) or not results or language not in LANGS:
        return respond(400, {"error": "bad_request"})
    for r in results:
        if not {"benefitId", "verdict"} <= set(r):
            return respond(400, {"error": "bad_result_shape"})
    return respond(200, {"explanations": explain_results(results, language)})
```

- [ ] **Step 6: Run the full suite and commit**

```bash
python -m pytest -v
cd .. && git add backend/src backend/tests/test_explain.py
git commit -m "feat(explain): grounded Strands/Bedrock explanation with digit guardrail and fallback"
```

---

## Task 9: Deploy the real handlers and smoke-test end to end

**Files:**
- Modify: `backend/template.yaml` (none needed unless region/model changed), `backend/src/haqcheck/bundled/` (generated copy)

- [ ] **Step 1: Bundle the policy maps as a fallback**

```bash
cd backend
mkdir -p src/haqcheck/bundled
cp ../policies/build/*.policy_map.json src/haqcheck/bundled/
echo "backend/src/haqcheck/bundled/" >> ../.gitignore
```
PowerShell equivalent:
```powershell
cd backend
New-Item -ItemType Directory -Force src/haqcheck/bundled | Out-Null
Copy-Item ../policies/build/*.policy_map.json src/haqcheck/bundled/
Add-Content ../.gitignore "backend/src/haqcheck/bundled/"
```

- [ ] **Step 2: Build and deploy**

```bash
sam build && sam deploy
```
Expected: UPDATE_COMPLETE.

- [ ] **Step 3: Smoke /evaluate (demo Case 1)**

```bash
curl -s -X POST "$API_URL/evaluate" -H 'content-type: application/json' -d '{
  "jurisdiction": "karnataka",
  "facts": {"state":"KA","daysWorkedLast12m":73,"eshramRegistered":true,"platforms":["zomato","swiggy"],"vehicle":"two_wheeler","age":24}
}' | python -m json.tool
```
Expected: 200; `ka_welfare_fund` → `Eligible` citing `KA-HC-2026-cess-scope`; `central_social_security` → `Not eligible` with empty `cited`; `rulesetVersion` present.

- [ ] **Step 4: Smoke /evaluate (demo Case 2)**

Same call with `"state":"MH","daysWorkedLast12m":120`. Expected: `central_social_security` → `Eligible` citing `IN-SSR2026-90day`; `ka_welfare_fund` → `Not applicable` citing `KA-HC-2026-out-of-state`.

- [ ] **Step 5: Smoke /explain in Hindi**

```bash
curl -s -X POST "$API_URL/explain" -H 'content-type: application/json' -d '{
  "language": "hi",
  "results": [{"benefitId":"central_social_security","verdict":"Not eligible","cited":[],
    "why":[{"label":"Days worked in the last 12 months","met":false,"actual":73,"required":90}],
    "nextStep":"Keep working and re-check after 90 days."}]
}'
```
Expected: 200 with a Hindi sentence containing 73 and 90 and no other numbers. If you get an access error, enable the model in Bedrock → Model access for the region, or change `BedrockModelId` via `sam deploy --parameter-overrides BedrockModelId=<id>`.

- [ ] **Step 6: Check a case landed in DynamoDB**

```bash
aws dynamodb scan --table-name $TABLE_NAME --max-items 3 --query "Items[].PK"
```
Expected: at least one `CASE#...` plus the `RULESET#...` items.

- [ ] **Step 7: Commit**

```bash
cd .. && git add .gitignore && git commit -m "chore: bundle policy maps as Lambda fallback"
```

---

## Task 10: Frontend scaffold, data copy, API client, facts form

**Files:**
- Create: `frontend/` (Vite scaffold), `frontend/scripts/copy-data.mjs`, `frontend/src/types.ts`, `frontend/src/api.ts`, `frontend/src/components/FactsForm.tsx`, `frontend/.env.example`

- [ ] **Step 1: Scaffold**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install && npm install -D vitest
rm src/App.css src/index.css src/assets/react.svg   # scaffold styling (dark, centered) would fight ours
# PowerShell: Remove-Item src/App.css, src/index.css, src/assets/react.svg
```
(The template currently scaffolds React 19; everything in this plan works on 18 or 19.)

Rewrite `src/main.tsx` so it imports no scaffold CSS:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

In `tsconfig.app.json` `compilerOptions`, make sure JSON imports compile under `tsc -b` (the template may or may not already have it):
```json
"resolveJsonModule": true
```

Add to `package.json` scripts (the `pre*` hooks regenerate the gitignored `src/data/` so a fresh clone never fails on a missing JSON import):
```json
"sync-data": "node scripts/copy-data.mjs",
"predev": "npm run sync-data",
"prebuild": "npm run sync-data",
"pretest": "npm run sync-data",
"test": "vitest run"
```

- [ ] **Step 2: Data copy script** (requirements + cedar texts into `src/data`, gitignored)

`frontend/scripts/copy-data.mjs`:
```js
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const policies = join(here, "..", "..", "policies");
const out = join(here, "..", "src", "data");
mkdirSync(out, { recursive: true });

writeFileSync(join(out, "requirements.json"), readFileSync(join(policies, "requirements.json")));

const readDir = (d) =>
  readdirSync(join(policies, d)).filter((f) => f.endsWith(".cedar"))
    .map((f) => ({ file: `${d}/${f}`, text: readFileSync(join(policies, d, f), "utf8") }));
const rulebooks = {
  central: { displayName: "Central (Social Security Rules 2026)", common: readDir("common"), overlay: [] },
  karnataka: { displayName: "Karnataka (Central + Karnataka HC order)", common: readDir("common"), overlay: readDir("karnataka") },
};
writeFileSync(join(out, "rulebooks.json"), JSON.stringify(rulebooks, null, 2));
console.log("synced policies into src/data");
```

Run `npm run sync-data`. Expected: `src/data/requirements.json` and `src/data/rulebooks.json` exist.

- [ ] **Step 3: Types**

`frontend/src/types.ts`:
```ts
export type Jurisdiction = "central" | "karnataka";
export type Verdict = "Eligible" | "Not eligible" | "Not applicable";
export type Language = "en" | "hi" | "kn";

export interface Facts {
  state: string;
  daysWorkedLast12m: number;
  eshramRegistered: boolean;
  platforms: string[];
  vehicle: "bicycle" | "two_wheeler" | "three_wheeler" | "four_wheeler" | "none";
  age: number;
}

export interface Cited { id: string; source: string; confidence: string; effect: string; file: string }

export interface Result {
  benefitId: string;
  verdict: Verdict;
  avpPolicyIds: string[];
  cited: Cited[];
}

export interface EvaluateResponse {
  caseId: string;
  rulebook: Jurisdiction;
  rulebookName: string;
  rulesetVersion: string;
  results: Result[];
}

export interface Why { label: string; met: boolean; actual: unknown; required: unknown }

export interface ExplainItem extends Pick<Result, "benefitId" | "verdict" | "cited"> {
  why: Why[];
  nextStep: string;
}
```

- [ ] **Step 4: API client**

`frontend/src/api.ts`:
```ts
import type { EvaluateResponse, ExplainItem, Facts, Jurisdiction, Language } from "./types";

const BASE = import.meta.env.VITE_API_BASE as string;

export class ApiError extends Error {
  status: number;
  body: unknown;
  // no parameter properties: newer Vite tsconfigs set erasableSyntaxOnly, which rejects them under tsc -b
  constructor(status: number, body: unknown) { super(`API ${status}`); this.status = status; this.body = body; }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, json);
  return json as T;
}

export const evaluate = (facts: Facts, jurisdiction: Jurisdiction) =>
  post<EvaluateResponse>("/evaluate", { facts, jurisdiction });

export const explain = (results: ExplainItem[], language: Language) =>
  post<{ explanations: Record<string, string> }>("/explain", { results, language });
```

`frontend/.env.example`:
```
VITE_API_BASE=https://xxxx.execute-api.ap-south-1.amazonaws.com
```
Copy to `frontend/.env` with the real `ApiUrl`.

- [ ] **Step 5: Facts form**

`frontend/src/components/FactsForm.tsx`:
```tsx
import { useState } from "react";
import type { Facts } from "../types";

const PLATFORMS = ["zomato", "swiggy", "zepto", "urban_company", "porter", "ola", "uber", "other"];
const STATES = ["KA", "MH", "DL", "TN", "TS", "AP", "KL", "GJ", "UP", "WB", "RJ", "MP", "BR", "OD", "PB", "HR"];

export const DEMO_CASE_1: Facts = { state: "KA", daysWorkedLast12m: 73, eshramRegistered: true, platforms: ["zomato", "swiggy"], vehicle: "two_wheeler", age: 24 };
export const DEMO_CASE_2: Facts = { state: "MH", daysWorkedLast12m: 120, eshramRegistered: true, platforms: ["zomato"], vehicle: "two_wheeler", age: 27 };

interface Props { onSubmit: (f: Facts) => void; busy: boolean; errors?: Record<string, string> }

export function FactsForm({ onSubmit, busy, errors = {} }: Props) {
  const [f, setF] = useState<Facts>(DEMO_CASE_1);
  const set = <K extends keyof Facts>(k: K, v: Facts[K]) => setF({ ...f, [k]: v });
  const toggle = (p: string) =>
    set("platforms", f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]);

  return (
    <form className="card form" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <h2>Your facts</h2>
      <label>State
        <select value={f.state} onChange={(e) => set("state", e.target.value)}>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {errors.state && <small className="err">{errors.state}</small>}
      </label>
      <label>Days worked in the last 12 months
        <input type="number" min={0} max={366} value={f.daysWorkedLast12m}
          onChange={(e) => set("daysWorkedLast12m", Number(e.target.value))} />
        {errors.daysWorkedLast12m && <small className="err">{errors.daysWorkedLast12m}</small>}
      </label>
      <label className="row">
        <input type="checkbox" checked={f.eshramRegistered} onChange={(e) => set("eshramRegistered", e.target.checked)} />
        Registered on e-Shram
      </label>
      <fieldset><legend>Platforms you work on</legend>
        {PLATFORMS.map((p) => (
          <label key={p} className="chip">
            <input type="checkbox" checked={f.platforms.includes(p)} onChange={() => toggle(p)} /> {p.replace("_", " ")}
          </label>
        ))}
        {errors.platforms && <small className="err">{errors.platforms}</small>}
      </fieldset>
      <label>Vehicle
        <select value={f.vehicle} onChange={(e) => set("vehicle", e.target.value as Facts["vehicle"])}>
          {["two_wheeler", "bicycle", "three_wheeler", "four_wheeler", "none"].map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
        </select>
      </label>
      <label>Age
        <input type="number" min={18} max={80} value={f.age} onChange={(e) => set("age", Number(e.target.value))} />
        {errors.age && <small className="err">{errors.age}</small>}
      </label>
      <div className="row">
        <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check my haq"}</button>
        <button type="button" className="ghost" onClick={() => setF(DEMO_CASE_1)}>Case 1</button>
        <button type="button" className="ghost" onClick={() => setF(DEMO_CASE_2)}>Case 2</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Minimal `App.tsx` to prove the round trip**

`frontend/src/App.tsx`:
```tsx
import { useState } from "react";
import { evaluate, ApiError } from "./api";
import { FactsForm } from "./components/FactsForm";
import type { EvaluateResponse, Facts, Jurisdiction } from "./types";
import "./styles.css";

export default function App() {
  const [jurisdiction] = useState<Jurisdiction>("karnataka");
  const [resp, setResp] = useState<EvaluateResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function run(facts: Facts) {
    setBusy(true); setErrors({});
    try { setResp(await evaluate(facts, jurisdiction)); }
    catch (e) {
      if (e instanceof ApiError && e.status === 400) setErrors((e.body as { errors?: Record<string, string> }).errors ?? {});
      else alert("Rule engine unavailable. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <main className="layout">
      <FactsForm onSubmit={run} busy={busy} errors={errors} />
      <pre className="card">{resp ? JSON.stringify(resp, null, 2) : "Results appear here"}</pre>
    </main>
  );
}
```

`frontend/src/styles.css` (starter; polish in Task 11):
```css
:root { font-family: system-ui, sans-serif; color-scheme: light; --bg:#f6f7f9; --card:#fff; --ok:#137a3a; --no:#a12622; --na:#5b616e; }
body { margin:0; background:var(--bg); }
.layout { display:grid; grid-template-columns: 1fr 1.4fr; gap:16px; max-width:1100px; margin:0 auto; padding:16px; }
@media (max-width: 800px) { .layout { grid-template-columns:1fr; } }
.card { background:var(--card); border-radius:12px; padding:16px; box-shadow:0 1px 3px rgba(0,0,0,.08); }
.form label { display:block; margin:10px 0; font-size:14px; }
.form input[type=number], .form select { width:100%; padding:8px; margin-top:4px; }
.row { display:flex; gap:8px; align-items:center; }
.chip { display:inline-flex; gap:4px; margin:4px 8px 4px 0; }
.err { color:var(--no); display:block; }
button { padding:10px 14px; border-radius:8px; border:0; background:#232f3e; color:#fff; cursor:pointer; }
button.ghost { background:transparent; color:#232f3e; border:1px solid #232f3e; }
```

- [ ] **Step 7: Run and verify**

```bash
npm run build     # runs tsc -b first: catches type errors locally instead of inside the Amplify pipeline
npm run dev
```
Expected: `build` completes with no TypeScript errors and a `dist/` folder. Open the dev URL, click "Check my haq". Expected: the JSON from `/evaluate` appears with two results. If CORS errors appear in the console, confirm `CorsConfiguration` in `template.yaml` and redeploy. Repeat `npm run build` at the end of Tasks 11, 12 and 13 before committing.

- [ ] **Step 8: Commit**

```bash
cd .. && git add frontend
git commit -m "feat(frontend): Vite scaffold, data sync, API client, facts form round trip"
```

---

## Task 11: Requirements evaluation (TDD) and verdict cards

**Files:**
- Create: `frontend/src/requirements.ts`, `frontend/src/requirements.test.ts`, `frontend/src/components/VerdictCard.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/styles.css`

- [ ] **Step 1: Failing test**

`frontend/src/requirements.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { evaluateWhy, nextStepFor } from "./requirements";
import type { Facts } from "./types";

const f: Facts = { state: "KA", daysWorkedLast12m: 73, eshramRegistered: true, platforms: ["zomato"], vehicle: "two_wheeler", age: 24 };

describe("evaluateWhy", () => {
  it("marks the 90-day requirement unmet with actual/required", () => {
    const why = evaluateWhy("central_social_security", f);
    const days = why.find((w) => w.label.startsWith("Days worked"))!;
    expect(days.met).toBe(false);
    expect(days.actual).toBe(73);
    expect(days.required).toBe(90);
  });
  it("marks containsAny met when any platform matches", () => {
    const why = evaluateWhy("ka_welfare_fund", { ...f, platforms: ["porter", "zepto"] });
    expect(why.find((w) => w.label.startsWith("On a notified"))!.met).toBe(true);
  });
  it("returns the nextStep text for a verdict", () => {
    expect(nextStepFor("central_social_security", "Not eligible")).toMatch(/90 days/);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npm test
```
Expected: FAIL, cannot find module `./requirements`.

- [ ] **Step 3: Implement**

`frontend/src/requirements.ts`:
```ts
import data from "./data/requirements.json";
import type { Facts, Verdict, Why } from "./types";

type Req = { policyId: string; label: string; field: keyof Facts; op: "eq" | "gte" | "containsAny"; value: unknown };
type Benefit = { name: string; requirements: Req[]; nextStep: Record<Verdict, string> };
const benefits = (data as { benefits: Record<string, Benefit> }).benefits;

export function benefitName(id: string): string { return benefits[id]?.name ?? id; }

export function evaluateWhy(benefitId: string, facts: Facts): Why[] {
  const b = benefits[benefitId];
  if (!b) return [];
  return b.requirements.map((r) => {
    const actual = facts[r.field];
    let met = false;
    if (r.op === "eq") met = actual === r.value;
    else if (r.op === "gte") met = typeof actual === "number" && actual >= (r.value as number);
    else if (r.op === "containsAny") met = Array.isArray(actual) && (r.value as string[]).some((v) => actual.includes(v));
    return { label: r.label, met, actual, required: r.value };
  });
}

export function nextStepFor(benefitId: string, verdict: Verdict): string {
  return benefits[benefitId]?.nextStep[verdict] ?? "";
}
```

- [ ] **Step 4: Run to verify pass**

```bash
npm test
```
Expected: 3 passed.

- [ ] **Step 5: Verdict card**

`frontend/src/components/VerdictCard.tsx`:
```tsx
import type { Result, Why } from "../types";
import { benefitName } from "../requirements";

interface Props {
  result: Result;
  why: Why[];
  nextStep: string;
  explanation?: string;
  explaining: boolean;
  changed: boolean;
}

const TONE = { "Eligible": "ok", "Not eligible": "no", "Not applicable": "na" } as const;

function fmt(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

export function VerdictCard({ result, why, nextStep, explanation, explaining, changed }: Props) {
  const tone = TONE[result.verdict];
  return (
    <section className={`card verdict ${tone} ${changed ? "changed" : ""}`}>
      <header>
        <h3>{benefitName(result.benefitId)}</h3>
        <span className={`badge ${tone}`}>{result.verdict}</span>
      </header>

      <div className="cited">
        {result.cited.length === 0
          ? <p className="muted">No rule permits this yet. Requirements from the rulebook:</p>
          : result.cited.map((c) => (
            <p key={c.id}><code>{c.id}</code> <span className="muted">({c.effect}, {c.confidence})</span><br />{c.source}</p>
          ))}
      </div>

      <ul className="why">
        {why.map((w) => (
          <li key={w.label} className={w.met ? "met" : "unmet"}>
            {w.met ? "✓" : "✗"} {w.label}: <strong>{fmt(w.actual)}</strong> <span className="muted">(needs {fmt(w.required)})</span>
          </li>
        ))}
      </ul>

      <p className="next"><strong>Next step:</strong> {nextStep}</p>

      <div className="explain">
        <small className="muted">Explanation (generated from the rule above; it does not decide)</small>
        <p>{explaining ? "Writing…" : explanation ?? "—"}</p>
      </div>
    </section>
  );
}
```

Append to `styles.css`:
```css
.verdict header { display:flex; justify-content:space-between; align-items:center; gap:8px; }
.verdict h3 { margin:0; font-size:16px; }
.badge { padding:4px 10px; border-radius:999px; color:#fff; font-weight:600; white-space:nowrap; }
.badge.ok { background:var(--ok);} .badge.no { background:var(--no);} .badge.na { background:var(--na);}
.verdict.changed { animation: flash .9s ease; }
@keyframes flash { from { box-shadow:0 0 0 4px #ffb84d; } to { box-shadow:0 1px 3px rgba(0,0,0,.08); } }
.cited code { background:#eef; padding:2px 6px; border-radius:6px; }
.why { list-style:none; padding:0; } .why li { margin:4px 0; } .why .unmet { color:var(--no);} .why .met { color:var(--ok);}
.muted { color:#5b616e; } .explain { border-top:1px solid #eee; margin-top:8px; padding-top:8px; }
```

- [ ] **Step 6: Use the cards in `App.tsx`**

Replace the `<pre>` with:
```tsx
<div className="results">
  {resp?.results.map((r) => (
    <VerdictCard key={r.benefitId} result={r}
      why={evaluateWhy(r.benefitId, lastFacts!)}
      nextStep={nextStepFor(r.benefitId, r.verdict)}
      explaining={false} changed={false} />
  ))}
</div>
```
and keep the submitted facts in state: `const [lastFacts, setLastFacts] = useState<Facts | null>(null);` set in `run()` before calling `evaluate`. Import `VerdictCard`, `evaluateWhy`, `nextStepFor`.

- [ ] **Step 7: Verify in the browser**

`npm run dev`, click Case 1 → Check. Expected: Karnataka fund card green "Eligible" citing `KA-HC-2026-cess-scope`; Central card red "Not eligible" with "✗ Days worked: 73 (needs 90)".

- [ ] **Step 8: Commit**

```bash
cd .. && git add frontend && git commit -m "feat(frontend): requirements evaluation with tests and verdict cards"
```

---

## Task 12: Jurisdiction toggle, change animation, rulebook drawer, footer

**Files:**
- Create: `frontend/src/components/JurisdictionToggle.tsx`, `frontend/src/components/RulebookDrawer.tsx`, `frontend/src/components/Footer.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/styles.css`

- [ ] **Step 1: Toggle**

`frontend/src/components/JurisdictionToggle.tsx`:
```tsx
import type { Jurisdiction } from "../types";

interface Props { value: Jurisdiction; onChange: (j: Jurisdiction) => void; disabled: boolean }

export function JurisdictionToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="toggle" role="tablist" aria-label="Rulebook">
      {(["central", "karnataka"] as Jurisdiction[]).map((j) => (
        <button key={j} role="tab" aria-selected={value === j} disabled={disabled}
          className={value === j ? "on" : ""} onClick={() => onChange(j)}>
          {j === "central" ? "Central rulebook" : "Karnataka rulebook"}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rulebook drawer** (shows common + overlay; highlights determining policies)

`frontend/src/components/RulebookDrawer.tsx`:
```tsx
import rulebooks from "../data/rulebooks.json";
import type { Jurisdiction } from "../types";

type File = { file: string; text: string };
type Book = { displayName: string; common: File[]; overlay: File[] };
const books = rulebooks as Record<Jurisdiction, Book>;

interface Props { jurisdiction: Jurisdiction; highlightIds: string[]; open: boolean; onClose: () => void }

function idOf(text: string): string {
  return /@id\("([^"]+)"\)/.exec(text)?.[1] ?? "";
}

export function RulebookDrawer({ jurisdiction, highlightIds, open, onClose }: Props) {
  if (!open) return null;
  const book = books[jurisdiction];
  const other = books[jurisdiction === "central" ? "karnataka" : "central"];
  const render = (files: File[], dim: boolean) => files.map((f) => (
    <pre key={f.file} className={`cedar ${highlightIds.includes(idOf(f.text)) ? "hit" : ""} ${dim ? "dim" : ""}`}>
      <small>{f.file}</small>{"\n"}{f.text}
    </pre>
  ));
  return (
    <aside className="drawer">
      <header><h3>{book.displayName}</h3><button className="ghost" onClick={onClose}>Close</button></header>
      <h4>Common (central rules)</h4>
      {render(book.common, false)}
      <h4>Karnataka overlay {book.overlay.length === 0 && <span className="muted">(not in this rulebook)</span>}</h4>
      {render(book.overlay.length ? book.overlay : other.overlay, book.overlay.length === 0)}
    </aside>
  );
}
```

- [ ] **Step 3: Footer** (the disclaimer is part of the product)

`frontend/src/components/Footer.tsx`:
```tsx
interface Props { version?: string }
export function Footer({ version }: Props) {
  return (
    <footer className="foot">
      HaqCheck shows which written rule applies to the facts you entered. It is an eligibility estimate with citations,
      not legal advice. Rules change; this rulebook is version <code>{version ?? "—"}</code>.
      Decisions are computed by Cedar in Amazon Verified Permissions; the language model only explains.
    </footer>
  );
}
```

- [ ] **Step 4: Wire into `App.tsx`** (full file)

```tsx
import { useState } from "react";
import { evaluate, ApiError } from "./api";
import { FactsForm } from "./components/FactsForm";
import { VerdictCard } from "./components/VerdictCard";
import { JurisdictionToggle } from "./components/JurisdictionToggle";
import { RulebookDrawer } from "./components/RulebookDrawer";
import { Footer } from "./components/Footer";
import { evaluateWhy, nextStepFor } from "./requirements";
import type { EvaluateResponse, Facts, Jurisdiction, Verdict } from "./types";
import "./styles.css";

export default function App() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("karnataka");
  const [facts, setFacts] = useState<Facts | null>(null);
  const [resp, setResp] = useState<EvaluateResponse | null>(null);
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState(false);

  async function run(f: Facts, j: Jurisdiction) {
    setBusy(true); setErrors({});
    try {
      const next = await evaluate(f, j);
      const prev = new Map<string, Verdict>(resp?.results.map((r) => [r.benefitId, r.verdict] as const));
      setChanged(new Set(next.results.filter((r) => prev.size && prev.get(r.benefitId) !== r.verdict).map((r) => r.benefitId)));
      setResp(next); setFacts(f);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) setErrors((e.body as { errors?: Record<string, string> }).errors ?? {});
      else alert("Rule engine unavailable. Try again. (We never fall back to a guess.)");
    } finally { setBusy(false); }
  }

  const highlight = resp?.results.flatMap((r) => r.cited.map((c) => c.id)) ?? [];

  return (
    <>
      <header className="top">
        <h1>HaqCheck <small>your haq, cited</small></h1>
        <JurisdictionToggle value={jurisdiction} disabled={busy}
          onChange={(j) => { setJurisdiction(j); if (facts) run(facts, j); }} />
        <button className="ghost" onClick={() => setDrawer(true)}>View rulebook</button>
      </header>
      <main className="layout">
        <FactsForm onSubmit={(f) => run(f, jurisdiction)} busy={busy} errors={errors} />
        <div className="results">
          {resp && <p className="muted">Rulebook: {resp.rulebookName} · version {resp.rulesetVersion}</p>}
          {resp?.results.map((r) => (
            <VerdictCard key={r.benefitId} result={r} why={evaluateWhy(r.benefitId, facts!)}
              nextStep={nextStepFor(r.benefitId, r.verdict)} explaining={false} changed={changed.has(r.benefitId)} />
          ))}
        </div>
      </main>
      <RulebookDrawer jurisdiction={jurisdiction} highlightIds={highlight} open={drawer} onClose={() => setDrawer(false)} />
      <Footer version={resp?.rulesetVersion} />
    </>
  );
}
```

Append to `styles.css`:
```css
.top { display:flex; gap:12px; align-items:center; justify-content:space-between; max-width:1100px; margin:0 auto; padding:12px 16px; flex-wrap:wrap; }
.top h1 { margin:0; font-size:22px; } .top h1 small { font-weight:400; color:#5b616e; font-size:14px; margin-left:8px; }
.toggle button { background:#e9ecf1; color:#232f3e; border-radius:0; } .toggle button:first-child { border-radius:8px 0 0 8px; } .toggle button:last-child { border-radius:0 8px 8px 0; }
.toggle button.on { background:#232f3e; color:#fff; }
.drawer { position:fixed; right:0; top:0; bottom:0; width:min(560px, 100%); background:#fff; overflow:auto; padding:16px; box-shadow:-4px 0 16px rgba(0,0,0,.15); }
.drawer header { display:flex; justify-content:space-between; align-items:center; }
.cedar { background:#0f172a; color:#e2e8f0; padding:10px; border-radius:8px; font-size:12px; overflow:auto; }
.cedar.hit { outline:3px solid #ffb84d; } .cedar.dim { opacity:.35; }
.foot { max-width:1100px; margin:24px auto; padding:0 16px 24px; font-size:12px; color:#5b616e; }
```

- [ ] **Step 5: Verify the demo beats**

Case 1 on Karnataka → Check. Toggle to Central. Expected: Karnataka fund card flashes and reads "Not applicable" with source "Not covered by the central rulebook"; drawer shows the overlay dimmed. Toggle back, click Case 2 → Check. Expected: Central "Eligible" (IN-SSR2026-90day), Karnataka fund "Not applicable" citing `KA-HC-2026-out-of-state`; both cards flash.

- [ ] **Step 6: Commit**

```bash
cd .. && git add frontend && git commit -m "feat(frontend): jurisdiction toggle, change animation, rulebook drawer, disclaimer footer"
```

---

## Task 13: Explanation integration and language switch

**Files:**
- Modify: `frontend/src/App.tsx`, `frontend/src/components/VerdictCard.tsx` (already accepts props)

- [ ] **Step 1: Add explanation state and call after evaluate**

In `App.tsx` add:
```tsx
import { explain } from "./api";
import type { Language } from "./types";
// state
const [language, setLanguage] = useState<Language>("en");
const [explanations, setExplanations] = useState<Record<string, string>>({});
const [explaining, setExplaining] = useState(false);

async function fetchExplanations(next: EvaluateResponse, f: Facts, lang: Language) {
  setExplaining(true); setExplanations({});
  try {
    const items = next.results.map((r) => ({
      benefitId: r.benefitId, verdict: r.verdict, cited: r.cited,
      why: evaluateWhy(r.benefitId, f), nextStep: nextStepFor(r.benefitId, r.verdict),
    }));
    const { explanations } = await explain(items, lang);
    setExplanations(explanations);
  } catch {
    // spec §9: the decision card is unaffected
    setExplanations(Object.fromEntries(next.results.map((r) => [r.benefitId, "Explanation unavailable; the decision above is unaffected."])));
  } finally { setExplaining(false); }
}
```
Call `fetchExplanations(next, f, language)` at the end of the `try` block in `run()` (after `setResp(next); setFacts(f);`). Do not `await` it, so the cards render first.

- [ ] **Step 2: Language switch in the header**

```tsx
<select value={language} aria-label="Explanation language"
  onChange={(e) => { const l = e.target.value as Language; setLanguage(l); if (resp && facts) fetchExplanations(resp, facts, l); }}>
  <option value="en">English</option><option value="hi">हिन्दी</option><option value="kn">ಕನ್ನಡ</option>
</select>
```

- [ ] **Step 3: Pass explanation props to the cards**

```tsx
explanation={explanations[r.benefitId]} explaining={explaining}
```

- [ ] **Step 4: Verify**

Case 1 → Check. Expected: cards render instantly with "Writing…", then English text appears with only 73 and 90 as numbers. Switch to हिन्दी. Expected: Hindi text appears. If the model returns Devanagari numerals or new numbers, the backend fallback text appears instead; that is acceptable but check the prompt wording.

- [ ] **Step 5: Mobile check**

Resize to 390px wide. Expected: single column, toggle wraps, cards readable. Fix any overflow in `styles.css`.

- [ ] **Step 6: Rehearsal #0 (Saturday night, local dev server)**

Run the full spec §11 script once with a stopwatch against `npm run dev`. Note anything that took longer than its slot. This is the first of the spec's two rehearsals; #1 is Task 15 Step 2 against the live URL.

- [ ] **Step 7: Commit**

```bash
cd .. && git add frontend && git commit -m "feat(frontend): grounded explanations with EN/HI/KN switch"
```

---

## Task 14: Amplify Hosting deploy (live URL)

**Files:**
- Create: `amplify.yml` (repo root)

- [ ] **Step 1: Push the repo to GitHub (public)**

```bash
gh repo create haqcheck --public --source=. --push
```

- [ ] **Step 2: Write `amplify.yml`**

```yaml
version: 1
applications:
  - appRoot: frontend
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```
(`prebuild` in `package.json` runs `sync-data`, which reads `../policies`, so the whole repo must be checked out; Amplify does this.)

- [ ] **Step 3: Create the Amplify app**

AWS Console → Amplify → Create new app → GitHub → select `haqcheck`, branch `main`, monorepo root `frontend`. Environment variables: `VITE_API_BASE` = the `ApiUrl` output. Add a rewrite rule: source `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` → target `/index.html`, type `200 (Rewrite)`. Save and deploy.

- [ ] **Step 4: Verify the live URL** on a phone and a laptop. Run Case 1 and Case 2 and the toggle. This URL goes in the submission.

- [ ] **Step 5: Commit**

```bash
git add amplify.yml && git commit -m "chore: Amplify Hosting build config" && git push
```

---

## Task 15: Rehearsal, README, video, submission (Sunday)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Re-sync and re-test policies one final time**

```bash
cd backend && python scripts/sync_policies.py && python scripts/run_tests.py && cd ..
```
Expected: `15 cases, 0 failures`. Do not touch policies after this.

- [ ] **Step 2: Rehearsal #1 against the live URL with a stopwatch** following spec §11. Target under 2:50. Take screenshots of Case 1, the toggle, Case 2, and the drawer as backup slides.

- [ ] **Step 3: Write the README**

```markdown
# HaqCheck — your haq, cited

Which welfare rule applies to you, decided by **Cedar** in **Amazon Verified Permissions** and cited to the clause. The LLM explains; it never decides.

**Live:** <Amplify URL>  ·  **Video:** <link>  ·  Built at WeMakeDevs × AWS Bharat Builds Tour, Stop 01 "First Commit", 17–20 Sept 2026.

## The problem
Gig workers in India cannot tell which social-security rule applies to them: the Social Security (Central) Rules 2026 set a 90-day threshold via e-Shram, while the Karnataka High Court (July 2026) ordered platforms to pay into a state welfare fund, and the two regimes are in dispute. Existing tools are directories, not verifiers.

## How it works
1. `policies/` holds the rules as readable Cedar with `@id`, `@source`, `@confidence` annotations. Two rulebooks: Central, and Karnataka (Central + overlay).
2. `sync_policies.py` pushes them to two Verified Permissions policy stores and records the policy-id → citation map.
3. `/evaluate` (Lambda) calls `IsAuthorized` per benefit with inline entities and maps ALLOW/DENY + determining policies to Eligible / Not eligible / Not applicable, each with the rule that decided it. Cases are logged to DynamoDB with the rulebook version.
4. `/explain` (Lambda, Strands Agents SDK on Bedrock) restates the verdict and cited rule in English/Hindi/Kannada. A digit guardrail rejects any output that invents numbers.
5. Frontend on Amplify Hosting: form, verdict cards, jurisdiction toggle, rulebook drawer.

## AWS services
Amazon Verified Permissions (Cedar) · Lambda · API Gateway (HTTP API) · DynamoDB · Amazon Bedrock (Amazon Nova Lite) via Strands Agents SDK · Amplify Hosting. Everything scales to zero; weekend cost under $1 excluding Bedrock calls.

## Run it
See `backend/` (SAM) and `frontend/` (Vite). Steps: `create_stores.py` once → `sam deploy` → `sync_policies.py` → `run_tests.py` → `npm run dev`.

## Sources
- Social Security (Central) Rules 2026, rule <N> — <link>
- Karnataka High Court order, <case no.>, 4 July 2026 — <link>

## Disclaimer
HaqCheck is an eligibility estimate with citations, not legal advice. Rulebook version is shown in the app footer.

## AI tools used (hackathon rule 03)
Claude Code (Anthropic) was used for planning, code generation and review. GitHub Copilot: <yes/no>. All Cedar policies were hand-authored and hand-verified against the sources above; no policy was generated by a model.
```

- [ ] **Step 4: Record the 2–3 minute video** (screen + voice) following spec §11. Upload (YouTube unlisted or Drive with link sharing).

- [ ] **Step 5: Optional Best Blog entry** — publish a short post on AWS Builder Center: problem, stack, "what fought back" (the AVP policy-id mapping). Link it in the submission.

- [ ] **Step 6: Final commit and push**

```bash
git add README.md && git commit -m "docs: README with architecture, sources, AI-tools disclosure" && git push
```

- [ ] **Step 7: Submit** through the First Commit form before the published deadline: repo URL, video link, live URL, writeup (problem / what we built / where AWS fits). Confirm the email receipt.

---

## Task 16 (stretch, only if Tasks 1–15 are done by Sunday noon): rule-drafting assistant

**Files:**
- Create: `backend/scripts/draft_policy.py`

- [ ] **Step 1: Create a scratch policy store** (STRICT, same schema) and note its id in `policies/build/stores.json` under `"scratch"`.

- [ ] **Step 2: Write the script**

```python
"""Propose a Cedar policy from rule text with Strands/Bedrock, validate it against the schema by
attempting CreatePolicy on a scratch store, print a diff for a human to accept. Never auto-publishes."""
import json
import os
import sys
from pathlib import Path

import boto3
from strands import Agent
from strands.models import BedrockModel

ROOT = Path(__file__).resolve().parents[2]
POL = ROOT / "policies"

SYSTEM = (
    "You write Cedar policies for the HaqCheck schema (namespace HaqCheck; Worker attrs: state String, "
    "daysWorkedLast12m Long, eshramRegistered Boolean, platforms Set<String>, vehicle String, age Long; "
    "resource HaqCheck::Benefit; action HaqCheck::Action::\"claim\"). Output ONLY one Cedar policy with "
    "@id, @source, @confidence annotations. No prose."
)


def main() -> None:
    rule_text = sys.stdin.read()
    stores = json.loads((POL / "build" / "stores.json").read_text())
    avp = boto3.client("verifiedpermissions", region_name=stores["region"])
    scratch = stores["stores"]["scratch"]
    avp.put_schema(policyStoreId=scratch, definition={"cedarJson": (POL / "schema.cedarschema.json").read_text()})

    agent = Agent(model=BedrockModel(model_id=os.environ.get("BEDROCK_MODEL_ID", "apac.amazon.nova-lite-v1:0"),
                                     region_name=os.environ.get("BEDROCK_REGION", "ap-south-1"), temperature=0),
                  system_prompt=SYSTEM, tools=[], callback_handler=None)
    for attempt in range(3):
        proposal = str(agent(f"Rule text:\n{rule_text}\n\nWrite the Cedar policy.")).strip().strip("`")
        try:
            r = avp.create_policy(policyStoreId=scratch, definition={"static": {"statement": proposal}})
            avp.delete_policy(policyStoreId=scratch, policyId=r["policyId"])
            print("VALID against schema. Review and save to policies/<dir>/<name>.cedar if correct:\n")
            print(proposal)
            return
        except Exception as e:
            print(f"attempt {attempt + 1} rejected by validator: {e}", file=sys.stderr)
            agent(f"The validator rejected it: {e}. Fix and output only the corrected policy.")
    print("Could not produce a valid policy in 3 attempts.")
    sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Try it on a paragraph of the Karnataka order**

```bash
python scripts/draft_policy.py < ka_para.txt
```
Expected: a Cedar policy that validates. Demo it only if this works in rehearsal; otherwise mention it in one sentence.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/draft_policy.py && git commit -m "feat(stretch): human-reviewed Cedar drafting assistant validated against the schema"
```

---

## Notes for whoever executes this

- **Never let the LLM into the decision path.** If `/evaluate` fails, the UI says the engine is unavailable. This is a product rule, and the demo says it out loud.
- **After every change to `policies/`:** `sync_policies.py` → `run_tests.py` → redeploy (`sam build && sam deploy`) only if the bundled fallback should update; the Lambda reads `RULESET#CURRENT` from DynamoDB, so a resync alone is live immediately.
- **Windows shells:** replace `export X=Y` with `$env:X="Y"` and `source .venv/bin/activate` with `.venv\Scripts\activate`.
- **If Verified Permissions is unavailable in `ap-south-1`:** set `AVP_REGION=us-east-1` for the scripts and `--parameter-overrides AvpRegion=us-east-1` on `sam deploy`. Everything else stays in Mumbai.
- **If Bedrock model access fails:** Bedrock console → Model access → enable Amazon Nova in the region, or override `BedrockModelId`. In `ap-south-1` the id must be the `apac.` inference-profile form.
- **Do not copy this workspace's spec/plan files into the `haqcheck` repo.** Their `2026-09-04` filenames predate the clock and invite an audit question. Commit dates are what matter, but keep the repo clean of pre-event artefacts.
- **Spec deltas accepted in this plan:** a missing `RULESET#` item surfaces as 502 `engine_unavailable` (the spec said 500); the footer omits "published <date>" because `/evaluate` returns the ruleset version only. Both are cosmetic; do not spend time on them.
