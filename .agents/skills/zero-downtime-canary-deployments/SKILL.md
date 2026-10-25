---
name: zero-downtime-canary-deployments
description: Progressive canary traffic shifting, blue/green deployments, automated metric analysis, and rollback with Argo Rollouts.
---

# Zero-Downtime Canary Deployments

## Overview
Deploys updates to a small fraction of real users (e.g., 5% -> 20% -> 50% -> 100%) while automatically verifying error rates and rolling back upon anomalies.

## Argo Rollouts Canary Strategy
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-service
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: { duration: 10m }
      - analysis:
          templates:
          - templateName: success-rate-metric
      - setWeight: 25
      - pause: { duration: 30m }
      - setWeight: 100
```
