---
name: kubernetes-helm-deployments
description: Reusable Helm charts, values schema validation, dry-run linting, and Kubernetes production deployment lifecycles.
---

# Kubernetes Deployments with Helm

## Overview
Packages, versions, and manages complex Kubernetes application manifests using parameterized Helm charts with strict schema validation.

## Helm Chart Hygiene Checklist
- [ ] `values.schema.json` defined for strict validation of inputs.
- [ ] Resource requests & limits defined for CPU/Memory on all containers.
- [ ] Liveness and Readiness probes configured with appropriate timeouts.
- [ ] PodDisruptionBudget (PDB) attached to critical deployments.

## Safe Lint & Dry-Run Pipeline
```bash
helm lint ./charts/my-service
helm template my-release ./charts/my-service --debug --values ./values-prod.yaml > /dev/null
helm upgrade --install my-release ./charts/my-service -f ./values-prod.yaml --dry-run
```
