---
name: network-chaos-injection
description: Simulating real-world network degradation, packet drops, bandwidth throttling, and latency using Toxiproxy.
---

# Network Chaos & Latency Injection with Toxiproxy

## Overview
Tests application behavior under degraded real-world networking conditions (high latency, dropped connections, bandwidth choking) via programmatic TCP proxies.

## Toxiproxy Scenario Example
```bash
# Add 1000ms latency to downstream database proxy
toxiproxy-cli toxic add -t latency -a latency=1000 db_proxy

# Simulate connection reset
toxiproxy-cli toxic add -t reset_peer redis_proxy
```

## Resilience Verification
Verify that client SDKs timeout within configured connection thresholds and initiate clean retries with exponential backoff.
