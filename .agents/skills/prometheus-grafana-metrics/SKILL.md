---
name: prometheus-grafana-metrics
description: Prometheus metrics instrumentation (Counter, Gauge, Histogram) and Grafana alerting dashboard design.
---

# Prometheus Metrics & Grafana Dashboards

## Overview
Monitors application throughput, error rates, and latency distributions using the 4 Golden Signals (Latency, Traffic, Errors, Saturation).

## The Metric Types
1. **Counter**: Monotonically increasing counter (e.g., `http_requests_total`).
2. **Gauge**: Current snapshot value that goes up or down (e.g., `active_connections`).
3. **Histogram**: Samples observations into configurable buckets for percentile latency calculation (`http_request_duration_seconds_bucket`).

## PromQL Error Rate Alert Rule
```yaml
- alert: HighAPIErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 1.0
  for: 3m
  labels:
    severity: page
  annotations:
    summary: "API error rate exceeds 1% for 3 minutes"
```
