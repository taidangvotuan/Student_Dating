---
name: neon-postgres-branching
description: Serverless Postgres copy-on-write branching for instant ephemeral test databases, PR previews, and schema migrations.
---

# Neon Serverless Postgres Branching & Ephemeral Environments

## Overview
Neon decouples compute from storage using a custom distributed pageserver architecture. This enables instant, copy-on-write database branches that share underlying immutable pages until written, allowing isolated preview environments, zero-risk migrations, and fast regression test sandboxes.

## Key Principles & Concepts
1. **Copy-on-Write Storage**: Branching takes < 1 second regardless of database size because only a new storage pointer (LSN) is created.
2. **Ephemeral PR Environments**: Every pull request gets a dedicated, isolated database branch matching production state.
3. **Branch Lifecycle Automation**: Branches are automatically created on PR open and purged on PR merge/close to prevent billing sprawl.
4. **Point-in-Time Branching**: Create branches as of a specific timestamp or transaction LSN for debugging production incidents without touching production data.

## Implementation Patterns

### 1. GitHub Actions CI/CD Ephemeral Branching
```yaml
name: CI Database Branching
on:
  pull_request:
    types: [opened, synchronize, closed]

jobs:
  ephemeral-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create Neon Branch on PR Open
        if: github.event.action != 'closed'
        uses: neondatabase/create-branch-action@v5
        id: create-branch
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          api_key: ${{ secrets.NEON_API_KEY }}
          branch_name: pr-${{ github.event.number }}
          parent: main

      - name: Run Prisma/Drizzle Migrations against Branch
        if: github.event.action != 'closed'
        env:
          DATABASE_URL: ${{ steps.create-branch.outputs.db_url }}
        run: |
          npx prisma migrate deploy
          npm test

      - name: Delete Branch on PR Close
        if: github.event.action == 'closed'
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ secrets.NEON_PROJECT_ID }}
          api_key: ${{ secrets.NEON_API_KEY }}
          branch_name: pr-${{ github.event.number }}
```

### 2. Neon Serverless Driver with Connection Pooling
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environments (Edge runtimes like Cloudflare Workers support native WebSocket)
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use pooled connection string
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function executeQuery<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    client.release();
  }
}
```

## Best Practices & Anti-Patterns
- **Do use pooled connections (`-pooler`)**: For serverless and edge functions, always use the pooled connection string with PgBouncer.
- **Do set auto-suspend**: Configure compute to auto-suspend after 5 minutes of inactivity to minimize compute costs.
- **Do sanitize branch names**: Restrict branch names to alphanumeric characters and hyphens (`pr-${{ github.event.number }}`).
- **Don't hardcode branch connection strings**: Dynamically inject `DATABASE_URL` via environment variables.
- **Don't leave abandoned branches**: Implement a scheduled cron sweep to delete stale branches older than 7 days.\n