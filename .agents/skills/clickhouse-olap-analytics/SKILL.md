---
name: clickhouse-olap-analytics
description: High-throughput analytical data ingestion, MergeTree table engines, primary key design, and real-time aggregation in ClickHouse.
---

# ClickHouse Real-Time OLAP Analytics

## Overview
Powers real-time analytical queries, metrics dashboards, and telemetry ingestion processing billions of events per second.

## Table Engine Design (ReplacingMergeTree)
```sql
CREATE TABLE events (
    tenant_id UInt32,
    event_time DateTime64(3),
    event_type LowCardinality(String),
    user_id UUID,
    payload String
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (tenant_id, event_type, event_time, user_id);
```

## Best Practices
- **Batch Inserts**: Never execute single-row `INSERT` statements. Ingest in batches of 10,000 to 100,000 rows.
- **LowCardinality**: Apply `LowCardinality(String)` to repetitive strings (< 10,000 unique values) to save 80% RAM and disk space.
