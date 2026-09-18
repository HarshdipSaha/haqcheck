# Audit Log: Effort 001

> **Effort:** `001-aws-deployment-and-amplify`  
> **Date:** 2026-09-18

---

## Chronological Action & Verification Log

### Phase 1: Environment & Credential Setup
- **Action:** Verified installed developer tools:
  - AWS CLI v2: `aws-cli/2.36.42`
  - AWS SAM CLI: `1.166.1`
  - Python: `3.12.0`
  - Node.js: `v22.23.2`
  - Docker: `28.3.2`
- **Result:** CLI tools detected. Configured AWS credentials for IAM user `haqcheck-deploy`.
- **Verification:** `aws sts get-caller-identity` confirmed identity `arn:aws:iam::727646491749:user/haqcheck-deploy`.

### Phase 2: Unit Testing & Store Initialization
- **Action:** Executed pytest test suite in `backend/`:
  - `python -m pytest -v`
  - **Output:** 25 passed in 0.36s.
- **Action:** Created Amazon Verified Permissions policy stores:
  - `python scripts/create_stores.py`
  - **Output:**
    - Central: `XiKowsn8gqRHXuTQr1Dsuf`
    - Karnataka: `QuKBLNiHJBrTdgwroJgUFc`
    - Output written to `policies/build/stores.json`.

### Phase 3: SAM Infrastructure Build & Deploy
- **Action:** Built SAM application:
  - `sam build` ➔ Success.
- **Action:** Deployed CloudFormation stack:
  - `sam deploy`
  - **Created Resources:**
    - `haqcheck-CasesTable-1KC71H1AIB5MH` (AWS::DynamoDB::Table)
    - `Api` (AWS::ApiGatewayV2::Api)
    - `EvaluateFunction` & `ExplainFunction` (AWS::Lambda::Function)
    - `ApiUrl`: `https://wi73sdx8ib.execute-api.ap-south-1.amazonaws.com`

### Phase 4: Policy Synchronization & Live Integration Testing
- **Action:** Synced Cedar policies with DynamoDB table:
  - `python scripts/sync_policies.py --table haqcheck-CasesTable-1KC71H1AIB5MH`
  - **Output:**
    - `[central] permit IN-SSR2026-90day` -> `MVvWGDgSsL9U6unG9gbcSX`
    - `[karnataka] permit IN-SSR2026-90day` -> `G1hg9py97coeC7uRjFXVop`
    - `[karnataka] permit KA-HC-2026-cess-scope` -> `2gySUh4V7hfVN4NYerM2RB`
    - `[karnataka] forbid KA-HC-2026-out-of-state` -> `Rs3JbEGzYH45tvGV93omZX`
    - `RULESET#` items successfully written to DynamoDB.
- **Action:** Executed live AVP test cases:
  - `python scripts/run_tests.py`
  - **Output:** 15 cases, 0 failures (100% pass).
- **Action:** Live HTTP tests to deployed API Gateway:
  - POST `/evaluate` ➔ HTTP 200 with Cedar citations.
  - POST `/explain` (Bedrock Nova Lite) ➔ HTTP 200 with clean multilingual explanations.
  - DynamoDB scan confirmed audit cases and rulesets stored.

### Phase 5: Frontend Build & Amplify CI/CD Integration
- **Action:** Created `frontend/.env` pointing `VITE_API_BASE` to deployed API Gateway.
- **Action:** Ran frontend tests & production build:
  - `npm test` ➔ 3 passed in Vitest.
  - `npm run build` ➔ bundled `dist/` cleanly in 741ms.
- **Issue Encountered:** First Amplify deployment failed on `cd frontend` during the `build` phase.
  - *Diagnosis:* Amplify preserves the working directory across build phases in the same container session. Because `preBuild` already did `cd frontend`, running `cd frontend` a second time threw `cd: frontend: No such file or directory`.
  - *Resolution:* Removed redundant `cd frontend` from `build.commands` in `amplify.yml` (commit `32160c2`).
- **Final Deployment:**
  - Deployment succeeded.
  - Live URL: **https://main.duuh4vgnn5xa3.amplifyapp.com/**

### Phase 6: Automated Playwright E2E Verification
- **Action:** Subagent executed browser automation test suite using Playwright on live URL:
  - Page load: 1385ms, HTTP 200, 0 console errors, 0 failed assets.
  - Evaluated worker scenarios (Karnataka Swiggy rider with 73 days: Central Not Eligible, Karnataka Eligible with `KA-HC-2026-cess-scope`).
  - Evaluated 95-day threshold flip: Central flipped to Eligible with `IN-SSR2026-90day`.
  - Responsive testing: Mobile 390×844 verified with zero horizontal overflow (`scrollWidth: 390px`).
  - Desktop capture: 1440×900 populated state saved to `desktop-1440x900.png`.

### Phase 7: AWS Builder Center Publication
- **Action:** Technical architecture deep dive authored and published on AWS Builder Center:
  - Article: *"Cedar Decides. The LLM Just Talks."*
  - Public URL: [https://builder.aws.com/content/3JUK7jCVjwlCkjniq3MelEzflJU/cedar-decides-the-llm-just-talks](https://builder.aws.com/content/3JUK7jCVjwlCkjniq3MelEzflJU/cedar-decides-the-llm-just-talks)
  - Linked in `README.md` and prepared for WeMakeDevs "Best Blog" prize submission.
