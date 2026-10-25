---
name: duckdb-in-memory-analytics
description: High-performance embedded OLAP analytics with DuckDB, querying Parquet/CSV files directly with zero-copy vectorized execution.
---

# DuckDB In-Memory Analytics & Querying

## Overview
DuckDB provides blazing-fast analytical queries on local datasets, S3 buckets, and Parquet files without spinning up heavy cloud data warehouses.

## Direct Parquet Querying Pattern
```python
import duckdb

# Query multiple remote or local Parquet files with zero ingestion delay
con = duckdb.connect()
df = con.execute("""
    SELECT 
        date_trunc('day', timestamp) AS order_date,
        country,
        sum(amount_usd) AS daily_revenue,
        count(distinct customer_id) AS active_buyers
    FROM 's3://analytics-bucket/events/year=2026/*.parquet'
    WHERE amount_usd > 0
    GROUP BY 1, 2
    ORDER BY daily_revenue DESC
    LIMIT 20
""").df()
```

## Performance Guidelines
- Leverage DuckDB's vectorized columnar engine for multi-threaded aggregation.
- Use `PRAGMA threads=8;` and `PRAGMA memory_limit='16GB';` to prevent memory thrashing.
