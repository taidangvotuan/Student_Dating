---
name: log-aggregation-loki-elk
description: Centralized structured logging with Grafana Loki and Elastic (ELK), JSON formatting, correlation IDs, and retention policies.
---

# Structured Log Aggregation (Loki & ELK)

## Overview
Aggregates logs from hundreds of distributed containers into a searchable query engine with sub-second lookups.

## Mandatory JSON Log Fields
Every application log line must output valid JSON containing:
```json
{
  "timestamp": "2026-10-21T12:00:00.123Z",
  "level": "INFO",
  "correlation_id": "req-9876-abcd-5432",
  "user_id": "usr_9981",
  "message": "Payment captured successfully",
  "duration_ms": 142
}
```
