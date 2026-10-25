---
name: redis-distributed-caching
description: Redis caching strategies, Cache-Aside, Write-Through, TTL jitter, and cache stampede prevention.
---

# Redis Distributed Caching Patterns

## Overview
Accelerates database throughput and eliminates repetitive query load with high-throughput Redis caching layers.

## Stampede & Thundering Herd Prevention
- **TTL Jitter**: Never expire multiple keys at the identical second. Always append random jitter (`ttl = base_ttl + random(0, 300)`).
- **Probabilistic Early Expiration (XFetch)**: Recompute and refresh the cached entry in the background before it reaches 0s TTL.

## Cache-Aside Pattern (Python)
```python
import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def get_user_profile(user_id: str):
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Cache miss: fetch from DB
    profile = db.fetch_user(user_id)
    r.setex(cache_key, 3600 + random.randint(0, 300), json.dumps(profile))
    return profile
```
