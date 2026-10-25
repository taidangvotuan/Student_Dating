---
name: rate-limiting-distributed-ddos
description: Distributed rate limiting using Redis Token Bucket / Sliding Window algorithms to mitigate brute-force and DDoS attacks.
---

# Distributed Rate Limiting & Abuse Prevention

## Overview
Shields APIs, login endpoints, and expensive LLM endpoints from brute-force credential stuffing and denial of service.

## Sliding Window Log Pattern
Track request timestamps in a Redis sorted set (`ZADD`) and prune timestamps older than the rate limit window (`ZREMRANGEBYSCORE`).
