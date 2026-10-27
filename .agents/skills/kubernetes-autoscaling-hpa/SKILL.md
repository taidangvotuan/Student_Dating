---
name: kubernetes-autoscaling-hpa
description: Horizontal Pod Autoscaler (HPA), KEDA event-driven scaling, and Pod Disruption Budgets for high-availability workloads.
---

# Kubernetes Autoscaling & Resilience

## Overview
Ensures workloads scale automatically based on CPU, memory, and custom business metrics (e.g. queue depth, HTTP requests per second) while preventing service outages.

## Production HPA Manifest
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```
