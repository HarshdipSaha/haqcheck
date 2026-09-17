<div align="center">

# ⚖️ HaqCheck

### your haq, cited.

Which Indian gig-worker welfare rule applies to you — decided by **Cedar** in Amazon Verified Permissions, cited to the clause. The LLM only explains the verdict. It never decides.

[![AWS Verified Permissions](https://img.shields.io/badge/AWS-Verified%20Permissions-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/verified-permissions/)
[![Cedar](https://img.shields.io/badge/Policy%20Engine-Cedar-232F3E?style=flat-square)](https://www.cedarpolicy.com/)
[![Amazon Bedrock](https://img.shields.io/badge/Amazon%20Bedrock-Nova%20Lite-8C4FFF?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/bedrock/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](backend/requirements-dev.txt)
[![Tests](https://img.shields.io/badge/unit%20tests-25%20passing-3fb950?style=flat-square)](backend/tests/)
[![Hackathon](https://img.shields.io/badge/WeMakeDevs%20%C3%97%20AWS-Bharat%20Builds%20Tour-0d1117?style=flat-square)]()

**[The problem](#the-problem)** · **[How it works](#how-it-works)** · **[Try it](#try-it)**

</div>

<div align="center">
  <img src="docs/assets/demo.gif" alt="Switching worker scenarios in HaqCheck: a 73-day case comes back Not Eligible under Central Rules, crossing the 90-day threshold flips it to Eligible with a fresh citation, and the Cedar Rules drawer shows the actual policy — IN-SSR2026-90day — that made the call, highlighted as the active determining policy." width="880">
</div>

---

## The problem

Two Indian welfare regimes for gig workers now overlap, and they don't agree.

- **Social Security (Central) Rules, 2026** — a 90-day work threshold on a single aggregator, enforced through e‑Shram registration.
- **Karnataka High Court, July 2026** — orders Swiggy, Zomato, Zepto and Urban Company to pay into a separate state welfare fund.

> Nothing tells a worker which regime actually applies to them. Existing tools are directories, not verifiers. HaqCheck is a verifier — and it shows its work.

## How it works

**Cedar decides. The LLM only explains.**

1. **Policies** — two Cedar rulebooks (Central, and Karnataka = Central + overlay), hand-authored with `@id` / `@source` / `@confidence` annotations, live in [`policies/`](policies/).
2. **Sync** — `sync_policies.py` pushes them to two Amazon Verified Permissions policy stores and records a policy-id → citation map.
3. **Evaluate** — `/evaluate` (Lambda) calls `IsAuthorized` per benefit with inline entities, and maps ALLOW/DENY + the determining policy to **Eligible / Not eligible / Not applicable** — each verdict carries the rule that decided it. Every case is logged to DynamoDB with the rulebook version.
4. **Explain** — `/explain` (Lambda, Strands Agents SDK on Bedrock Nova Lite) restates the verdict and its cited rule in English, Hindi or Kannada. A digit guardrail rejects any output that invents a number.
5. **Frontend** — Amplify-hosted form, verdict cards, jurisdiction toggle, rulebook drawer.

> The LLM never makes the call. It receives an already-determined verdict and a citation, and puts it into plain language — it cannot override Cedar, and it's not allowed to invent a number that isn't in the source rule.

## Built on AWS

Amazon Verified Permissions (Cedar) · Lambda · API Gateway (HTTP API) · DynamoDB · Amazon Bedrock (Nova Lite) via Strands Agents SDK · Amplify Hosting.

Everything scales to zero. Weekend cost: **under $1**, excluding Bedrock calls.

## Try it

No hosted demo yet — Amplify deployment and the 2–3 min demo video are the last two tasks before submission.

Until then, run it locally:

<details>
<summary><b>Full setup & run instructions</b></summary>

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows; source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
python -m pytest -v                                # 25 unit tests, no AWS needed

python scripts/create_stores.py                    # once for the event
sam build && sam deploy                             # needs AWS credentials
python scripts/sync_policies.py                     # pushes Cedar policies to both AVP stores
python scripts/run_tests.py                          # 15 live-AVP cases

# Frontend
cd ../frontend
npm install
cp .env.example .env                                 # set VITE_API_BASE to the sam deploy ApiUrl output
npm run dev
```

</details>

## Sources & disclaimer

<details>
<summary><b>Legal sources & disclaimer</b></summary>

- Social Security (Central) Rules, 2026 — gazetted 8 May 2026; 90-day (single aggregator) work threshold and e-Shram/Shram Suvidha registration for gig/platform workers. Exact rule number not confirmed against the primary gazette text; encoded from consistent secondary reporting (Medianama, Business Standard, JSA, Lexology).
- *Internet and Mobile Association of India (IAMAI) & Ors. v. State of Karnataka & Ors.*, Karnataka High Court, interim order dated 4 July 2026 (Justice M Nagaprasanna) — directed Swiggy, Zomato (Eternal Ltd), Zepto and Urban Company to deposit the welfare fee under the Karnataka Platform-Based Gig Workers (Social Security and Welfare) Act, 2025. Case/WP number not confirmed against the primary order; encoded from consistent secondary reporting (BusinessToday, Bar & Bench, Medianama, LiveLaw).

**TODO before submission:** obtain and cite the primary gazette text and court order directly (Task 0 Step 3 of the plan); if still unavailable, the `@confidence("secondary-source")` annotations already shipped are accurate and stay as-is.

**Disclaimer:** HaqCheck is an eligibility estimate with citations, not legal advice. The rulebook version is shown in the app footer.

</details>

## Built for WeMakeDevs × AWS Bharat Builds Tour

Stop 01, "First Commit" — 17–20 Sept 2026, Bangalore.

<details>
<summary><b>AI tools used (hackathon rule 03)</b></summary>

Claude Code (Anthropic) was used for planning, code generation and review. All Cedar policies were hand-authored against the sources above (with citation research done via web search, not generated by a model); the underlying facts were verified before the policies were written, not invented by the model.

</details>

<div align="center">
<br>
<b>HaqCheck</b> — your haq, cited.
</div>
