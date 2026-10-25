---
name: chaos-engineering-resilience
description: Proactive resilience testing using Chaos Mesh and LitmusChaos, simulating pod crashes, CPU spikes, and dependency failures.
---

# Chaos Engineering & Resilience Testing

## Overview
Uncovers hidden cascading failures in distributed microservices by injecting controlled disruptions into staging or canary environments.

## Core Chaos Experiments
1. **Pod Chaos**: Randomly terminate random pod replicas in a deployment.
2. **Network Chaos**: Inject 200ms latency or 10% packet drop between services.
3. **IO Chaos**: Inject file system read/write delays or disk pressure.
4. **Stress Chaos**: Maximize CPU / memory consumption to test OOM-killer resilience.

## Verification Checklist
- [ ] Circuit breakers open properly when downstream service degrades.
- [ ] HTTP 503 fallback or cached response returns within SLA.
- [ ] No cascading failure or retry storm brings down the primary database.
