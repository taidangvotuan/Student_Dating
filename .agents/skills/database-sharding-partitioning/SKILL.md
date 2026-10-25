---
name: database-sharding-partitioning
description: Relational database sharding, range and hash partitioning, Citus, and Vitess distributed database architectures.
---

# Database Sharding & Table Partitioning

## Overview
Scales relational databases beyond the storage and IOPS limits of a single server instance using horizontal partitioning and sharding.

## Declarative PostgreSQL Range Partitioning
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL,
    created_at TIMESTAMPTZ NOT NULL,
    action TEXT NOT NULL
) PARTITION BY RANGE (created_at);

-- Partitions by month
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```
