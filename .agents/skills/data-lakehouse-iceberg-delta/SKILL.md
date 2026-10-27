---
name: data-lakehouse-iceberg-delta
description: Modern Data Lakehouse architecture using Apache Iceberg and Delta Lake, ACID transactions, time travel, and schema evolution.
---

# Apache Iceberg & Delta Lake Lakehouse Patterns

## Overview
Brings relational database guarantees (ACID transactions, table snapshotting, in-place schema evolution) to massive object-store data lakes (S3, GCS).

## Key Capabilities
- **Time Travel**: Query previous snapshots for reproducible audits (`FOR SYSTEM_TIME AS OF '2026-01-01'`).
- **Partition Evolution**: Update partition strategies without rewriting petabytes of historical data.
