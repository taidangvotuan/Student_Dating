---
name: gcp-cloud-run-patterns
description: Google Cloud Run containerized serverless deployments, direct VPC egress, traffic splitting, and revision rollbacks.
---

# Google Cloud Run Production Patterns

## Overview
Runs stateless containers invocable via HTTPS or Pub/Sub events with automated zero-to-N scaling, custom domain SSL, and private VPC access.

## Safe Blue-Green Traffic Splitting
```bash
# Deploy revision 2 with 0% traffic
gcloud run deploy api-service     --image gcr.io/my-proj/api:v2     --no-traffic

# Route 10% traffic for canary testing
gcloud run services update-traffic api-service     --to-revisions api-service-00002-xyz=10

# Route 100% traffic once verified
gcloud run services update-traffic api-service     --to-revisions api-service-00002-xyz=100
```
