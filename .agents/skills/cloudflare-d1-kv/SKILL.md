---
name: cloudflare-d1-kv
description: Edge persistence using Cloudflare D1 (serverless SQLite) and Workers KV for low-latency globally distributed data.
---

# Cloudflare D1 & Workers KV Operations

## Overview
Combines relational ACID transactions at the edge (D1) with distributed key-value caching (KV) and Durable Objects for stateful edge systems.

## Data Tiering Pattern
- **KV**: Read-heavy session data, configuration flags, and rendered HTML fragments (<10ms edge reads).
- **D1**: Relational user tables, orders, and transactional data with SQLite queries.

## D1 Prepared Query Example
```typescript
const result = await env.DB.prepare(
  "SELECT id, username, email FROM users WHERE organization_id = ? LIMIT 50"
).bind(orgId).all();

return Response.json(result.results);
```
