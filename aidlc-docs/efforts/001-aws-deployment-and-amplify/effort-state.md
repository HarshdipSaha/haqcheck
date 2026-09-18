# Effort 001: AWS End-to-End Deployment & Amplify Hosting

> **Effort ID:** `001-aws-deployment-and-amplify`  
> **Status:** `complete`  
> **Started:** 2026-09-18T10:10:00+05:30  
> **Completed:** 2026-09-18T10:29:00+05:30  
> **Type:** Infrastructure Provisioning, Deployment & CI/CD Integration  
> **Domain:** AWS Cloud Serverless & Frontend Hosting  

---

## State Machine
`planning` ➔ `awaiting-approval` ➔ `in-progress` ➔ `complete`

- **Current State:** `complete`
- **Verification Evidence:** All 15 live AVP tests passed, live API Gateway responding, DynamoDB logging active, Bedrock Nova Lite inference operational, and AWS Amplify public app live.

---

## Objectives & Outcomes

1. [x] **AWS Identity & Access Configuration:** Configured scoped IAM credentials (`haqcheck-deploy`) on developer terminal in `ap-south-1`.
2. [x] **Amazon Verified Permissions Stores Creation:** Created Central and Karnataka policy stores with `STRICT` schema validation mode.
3. [x] **Serverless Backend Stack Deployment:** Deployed DynamoDB table, HTTP API Gateway, and Lambda functions via AWS SAM CLI.
4. [x] **Cedar Policy Synchronization:** Compiled and synced Cedar policies to AVP stores; seeded `RULESET#` metadata to DynamoDB.
5. [x] **Live System Verification:** Ran test suite against live cloud resources; tested `/evaluate` and `/explain` endpoints.
6. [x] **Frontend Environment Configuration:** Configured `VITE_API_BASE` in `haqcheck/frontend/.env` and verified production build with Vite.
7. [x] **AWS Amplify Hosting Pipeline:** Connected GitHub repository `HarshdipSaha/haqcheck`, resolved working-directory build issue, and deployed live web application.
8. [x] **Playwright E2E Automated Verification:** Performed full browser automation test on live URL across desktop (1440×900) and mobile (390×844) viewports with zero console errors.
9. [x] **Technical Article Publication:** Published official deep dive on AWS Builder Center for the "Best Blog" prize track.

---

## Live Resources

- **Public Web Application:** [https://main.duuh4vgnn5xa3.amplifyapp.com/](https://main.duuh4vgnn5xa3.amplifyapp.com/)
- **AWS Builder Center Article:** [https://builder.aws.com/content/3JUK7jCVjwlCkjniq3MelEzflJU/cedar-decides-the-llm-just-talks](https://builder.aws.com/content/3JUK7jCVjwlCkjniq3MelEzflJU/cedar-decides-the-llm-just-talks)
- **API Gateway Endpoint:** `https://wi73sdx8ib.execute-api.ap-south-1.amazonaws.com`
- **Central Policy Store ID:** `XiKowsn8gqRHXuTQr1Dsuf`
- **Karnataka Policy Store ID:** `QuKBLNiHJBrTdgwroJgUFc`
- **DynamoDB Table:** `haqcheck-CasesTable-1KC71H1AIB5MH`
- **Desktop Screenshot Artifact:** `desktop-1440x900.png`
