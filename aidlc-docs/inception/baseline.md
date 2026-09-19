# HaqCheck - AI-DLC Baseline Inception

**Phase**: Inception (Greenfield)
**Status**: COMPLETE
**Project Overview**: HaqCheck is a verifier that determines which Indian gig-worker welfare rule applies to a user (Central Rules 2026 vs Karnataka High Court order).
**Architecture**: 
- **Amazon Verified Permissions (Cedar)** for deterministic evaluation.
- **AWS Lambda** for `/evaluate` and `/explain`.
- **Amazon DynamoDB** for case logging.
- **Amazon Bedrock (Nova Lite)** to explain verdicts.
- **AWS Amplify Hosting** for the Vite/React frontend.

The idea was originally given by the user, setting the baseline for the hackathon project.
