---
name: cloudflare-workers-pages
description: Edge compute architecture, Wrangler deployment pipelines, routing, and sub-millisecond cold starts on Cloudflare Workers and Pages.
---

# Cloudflare Workers & Pages Architecture

## Overview
Deploys serverless applications directly to Cloudflare's global edge network (300+ PoPs) with zero cold starts and sub-10ms response times.

## Standard Wrangler Configuration (wrangler.toml)
```toml
name = "api-edge-router"
main = "src/index.ts"
compatibility_date = "2024-04-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"

[[kv_namespaces]]
binding = "SESSION_CACHE"
id = "a1b2c3d4e5"

[[d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "00000000-0000-0000-0000-000000000000"
```

## Edge Worker Implementation (TypeScript)
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "healthy" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    // High-performance streaming pass-through
    return fetch(request);
  }
};
```
