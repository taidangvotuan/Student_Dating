---
name: debezium-change-data-capture
description: Zero-downtime real-time Change Data Capture (CDC) from PostgreSQL/MySQL to Kafka using Debezium.
---

# Debezium Change Data Capture (CDC)

## Overview
Streams database row-level changes (INSERT, UPDATE, DELETE) directly into Kafka topics in real time by reading database write-ahead logs (WAL).

## Benefits
- **Zero Query Impact**: Bypasses SQL polling queries; reads WAL directly without degrading primary database throughput.
- **Cache Invalidation**: Automatically purge Redis cache keys within milliseconds of database row changes.
- **CQRS Read-Store Sync**: Replicate relational data into Elasticsearch or ClickHouse continuously.
