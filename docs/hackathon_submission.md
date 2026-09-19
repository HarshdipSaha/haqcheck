# Hackathon Submission: HaqCheck

## What does your project do? 

A Swiggy rider logs 90 days of delivery work. The next week, a high court orders aggregators to pay into a separate state fund. Which welfare rule actually covers that rider? We built HaqCheck to solve this.

Currently, 2 Indian welfare regimes for gig workers overlap, and they don't agree. Existing platforms are just static directories. HaqCheck acts as a deterministic verifier. We call this pattern verifiable policy routing. It takes a worker's facts, runs them against Cedar policy engines, and outputs a concrete eligibility verdict with the exact legal clause cited.

The tool serves the millions of platform workers navigating India's fragmented social security landscape.

## How did you use AWS in your project?

We encoded the legal logic directly into Cedar policies. For the open source build phase, we authored our rulebooks natively in Cedar. We used the AWS Serverless Application Model (SAM) CLI for local testing and infrastructure deployment. We also integrated the open-source Strands Agents SDK to orchestrate our LLM interactions cleanly.

For shipping the product, we deployed a fully serverless architecture. We pushed our Cedar policies into Amazon Verified Permissions for high-speed authorization queries. AWS Lambda and Amazon API Gateway handle the compute routing.

We persist every evaluation to Amazon DynamoDB for an immutable audit log. Amazon Bedrock (using the Nova Lite model) translates the strict Cedar verdicts into plain English, Hindi, and Kannada. The React frontend lives on AWS Amplify Hosting.

## Blog links

- https://builder.aws.com/content/3JUK7jCVjwlCkjniq3MelEzflJU/cedar-decides-the-llm-just-talks
- https://builder.aws.com/post/3JUNNe3oGijmQnWBcDKmTZf6lia_p/cedar-decides-the-llm-just-talks

## Team leader's contributions

**Harshdip Saha:** Mapped Indian legal clauses to logical constraints by hand-authoring the Cedar policy rulebooks. Engineered the serverless backend across AWS Lambda, Amazon API Gateway, and Amazon Verified Permissions. Built the Vite React frontend. Wired the Amazon Bedrock Strands Agents integration to generate multi-language explanations with strict numeric guardrails. Managed the CI/CD pipeline via AWS Amplify.

## Second team member's contributions
N/A (Solo submission)

## Third team member's contributions
N/A

## Fourth team member's contributions
N/A

## Help us evaluate you: your feedback on the AWS services you used *(required)*

Our terminal threw `ValidationException: Operation not allowed` the moment we tried running Bedrock Nova Lite in `ap-south-1`.

The onboarding flow for Amazon Bedrock recently changed, and it created an unexpected bottleneck. The console displays a retirement banner saying models activate automatically on first use. When we ran our test prompt, the playground returned a bare validation error while the account was quietly queued in a 2-hour verification hold. A simple banner on the Bedrock dashboard showing account verification status would save hours of trial and error.

Amazon Verified Permissions needs clearer schema debugging. In `STRICT` mode, entity validation errors return broad failure codes without pointing to the mismatched key. We lost 45 minutes to a single entity type mismatch that a JSON pointer in the error response would've exposed immediately. A local Cedar validator inside the SAM CLI would make policy authoring significantly faster.

AWS SAM policy templates also lack native coverage for Bedrock inference profiles. Macros don't support cross-region profiles like `apac.amazon.nova-lite-v1:0` out of the box. CloudFormation couldn't resolve the destination-region ARNs, which forced us to write overly broad `Resource: '*'` statements in our Lambda role.

## What did you like about the AWS services you used? *(required)*

Amazon Verified Permissions evaluated our authorization queries in 14 milliseconds.

Cedar gave us a formal syntax for expressing overlapping statutory rules. We pushed Central 90-day rules into one policy store and Karnataka gig worker regulations into a second store. The `is_authorized` API returned deterministic boolean verdicts and cited the exact rule ID, removing legal computation from our Lambda code entirely.

Amazon Bedrock's Nova Lite model generated grounded Hindi and Kannada explanations in under 2 seconds. The throughput was impressive. Running via the open-source Strands Agents SDK, it converted structured Cedar JSON into clean regional summaries without blowing through our hackathon token budget.

AWS SAM and AWS Amplify gave us a zero-maintenance delivery pipeline. Setting up our DynamoDB audit table, HTTP API Gateway, and Python runtime took 48 lines in `template.yaml`. Connecting our GitHub repository to Amplify provided automatic redeployments in under 2 minutes per push, and the whole stack idles at $0.00.

