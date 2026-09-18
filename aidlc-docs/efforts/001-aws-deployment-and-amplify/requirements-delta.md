# Requirements Delta: Effort 001

> **Effort:** `001-aws-deployment-and-amplify`  
> **Target Baseline:** `aidlc-docs/inception/baseline-architecture.md`

---

## 1. Scope & Delta

| Requirement Area | Baseline Expectation | Delta / Implementation Reality |
| :--- | :--- | :--- |
| **AWS Authentication** | CLI access configured with IAM administrator access | Configured AWS CLI profile with `ap-south-1` region and active IAM credentials. |
| **AVP Policy Stores** | Two policy stores (`central`, `karnataka`) in Mumbai | Initialized once using `scripts/create_stores.py`, verified strict mode and IDs recorded in `policies/build/stores.json`. |
| **Cloud Infrastructure** | Serverless stack provisioned with SAM | Built with `sam build` and deployed with `sam deploy` producing HTTP API and DynamoDB table. |
| **Policy Persistence** | Policies synchronized to AVP & DynamoDB | Executed `sync_policies.py --table <table-name>` to populate `RULESET#` items in DynamoDB. |
| **Bedrock Inference** | Amazon Nova Lite active in `ap-south-1` | AWS commercial region auto-enables Nova Lite; invocations succeed using `apac.amazon.nova-lite-v1:0`. |
| **Amplify CI/CD** | Monorepo build of `frontend` from GitHub | Updated `amplify.yml` to prevent duplicate `cd frontend` commands across persistent shell phases. |
| **Documentation** | Readme and setup guides reflect live status | Updated `README.md` and `AWS_SETUP_AND_DEPLOY.md` with live URLs and completed checklist. |

---

## 2. Non-Functional Requirements Addressed

- **Zero-Cost Scaling:** Lambda functions, DynamoDB pay-per-request, and HTTP API scale to zero when idle.
- **Strict Verification:** Verified Permissions validates policies at compile-time and runtime against the strict Cedar schema.
- **Security & Secrets Hygiene:** `.env` and `policies/build/` are ignored by git; credentials managed exclusively through AWS IAM and Amplify environment variables.
