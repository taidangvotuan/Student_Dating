---
name: datadog-apm-tracing
description: Distributed tracing and Application Performance Monitoring (APM) using Datadog, flame graph analysis, and span tagging.
---

# Datadog APM & Distributed Tracing

## Overview
Instrument microservices for complete visibility into end-to-end request latency, identifying downstream database and third-party API bottlenecks.

## Universal Service Tagging
Every service and trace span must export standard tags:
- `env`: `production`, `staging`, `development`
- `service`: Canonical service name (e.g., `payment-service`)
- `version`: Git commit SHA or semantic version tag

## Node.js / TypeScript Initialization
```typescript
import tracer from 'dd-trace';

tracer.init({
  service: 'order-api',
  env: process.env.NODE_ENV,
  version: process.env.GIT_SHA,
  logInjection: true, // Injects trace_id into application log lines
});

export default tracer;
```
