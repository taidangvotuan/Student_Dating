---
name: semantic-cache-redis
description: Vector similarity caching with Redis to intercept repetitive LLM queries, cutting API latency to <10ms and reducing cloud costs.
---

# Semantic Caching with Redis

## Overview
Intercepts incoming prompts and checks against a vector-indexed cache of previous prompt embeddings. If semantic similarity is > 0.95, returns the cached response instantly.

## Architecture
```
[User Query] -> [Generate Embedding] -> [Redis Vector Query]
   -> If Cosine Sim >= 0.96: Return Cached LLM Output (5ms, $0.00)
   -> If Cosine Sim <  0.96: Call LLM API -> Store in Redis -> Return Output
```

## Key Considerations
- **TTL Policies**: Expire or invalidate cached items when underlying data changes.
- **Personalization**: Always include `tenant_id` or `user_id` in metadata filters to prevent cross-user data leakage.
