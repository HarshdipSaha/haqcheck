# AWS Service Feedback: HaqCheck

## What you didn't like about the AWS services you used and what could be better *(required)*

Our terminal threw `ValidationException: Operation not allowed` the moment we tried running Bedrock Nova Lite in `ap-south-1`.

The onboarding flow for Amazon Bedrock recently changed, and it created an unexpected bottleneck. The console displays a retirement banner saying models activate automatically on first use. When we ran our test prompt, the playground returned a bare validation error while the account was quietly queued in a 2-hour verification hold. A simple banner on the Bedrock dashboard showing account verification status would save hours of trial and error.

Amazon Verified Permissions needs clearer schema debugging. In `STRICT` mode, entity validation errors return broad failure codes without pointing to the mismatched key. We lost 45 minutes to a single entity type mismatch that a JSON pointer in the error response would've exposed immediately. A local Cedar validator inside the SAM CLI would make policy authoring significantly faster.

AWS SAM policy templates also lack native coverage for Bedrock inference profiles. Macros don't support cross-region profiles like `apac.amazon.nova-lite-v1:0` out of the box. CloudFormation couldn't resolve the destination-region ARNs, which forced us to write overly broad `Resource: '*'` statements in our Lambda role.

---

## What did you like about the AWS services you used? *(required)*

Amazon Verified Permissions evaluated our authorization queries in 14 milliseconds.

Cedar gave us a formal syntax for expressing overlapping statutory rules. We pushed Central 90-day rules into one policy store and Karnataka gig worker regulations into a second store. The `is_authorized` API returned deterministic boolean verdicts and cited the exact rule ID, removing legal computation from our Lambda code entirely.

Amazon Bedrock's Nova Lite model generated grounded Hindi and Kannada explanations in under 2 seconds. The throughput was impressive. Running via the open-source Strands Agents SDK, it converted structured Cedar JSON into clean regional summaries without blowing through our hackathon token budget.

AWS SAM and AWS Amplify gave us a zero-maintenance delivery pipeline. Setting up our DynamoDB audit table, HTTP API Gateway, and Python runtime took 48 lines in `template.yaml`. Connecting our GitHub repository to Amplify provided automatic redeployments in under 2 minutes per push, and the whole stack idles at $0.00.
