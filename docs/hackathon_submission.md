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

## AWS Service Feedback

Amazon Verified Permissions feels incredibly powerful for legal rule engines. But the schema validation can be opaque when debugging complex entities. A native local simulator in the AWS console would save hours of trial and error.

Amazon Bedrock's Nova Lite models are fast and highly capable. It'd be helpful to have native token-level latency metrics exposed directly in the Bedrock console.

For the AWS Builder Center, the text editor sometimes strips formatting when pasting markdown drafts. A raw markdown toggle would make technical publishing much smoother.
