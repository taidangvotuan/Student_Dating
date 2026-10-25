---
name: curl-http-debugging-automation
description: Advanced HTTP request debugging with curl, custom format outputs, timing breakdowns, SSL inspection, and trace logs.
---

# HTTP Debugging & Timing Analysis with curl

## Overview
Diagnoses DNS resolution, TCP handshake, TLS negotiation, and Time-To-First-Byte (TTFB) latency using curl format strings.

## Latency Breakdown Template
```bash
curl -w "DNS: %{time_namelookup}s | TCP: %{time_connect}s | TLS: %{time_appconnect}s | TTFB: %{time_starttransfer}s | Total: %{time_total}s\n" \
     -o /dev/null -s https://api.example.com/health
```
