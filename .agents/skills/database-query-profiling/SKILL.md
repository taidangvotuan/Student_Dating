---
name: database-query-profiling
description: Deep database query performance profiling, EXPLAIN ANALYZE interpretation, index optimization, and sequential scan elimination.
---

# Database Query Profiling & Optimization

## Overview
Identifies slow queries, missing indexes, unselective filters, and inefficient table joins using PostgreSQL `EXPLAIN ANALYZE` and profiling telemetry.

## Analysis Checklist
1. **Seq Scan on Large Tables**: Indicates missing or unindexed filter columns.
2. **High Buffer Reads (`Buffers: shared hit/read`)**: Excessive data pulled into memory.
3. **Sort Method / External Merge Disk**: Sort operations spilling to disk due to low `work_mem`.
4. **Nested Loop with Large Outer Rows**: Consider hash join or index lookup optimization.

## Diagnostic Query
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.id, count(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id;
```
