---
name: polars-high-performance-df
description: Multi-threaded DataFrame manipulation using Polars (Rust engine), lazy evaluation, streaming mode, and memory optimization.
---

# High-Performance DataFrames with Polars

## Overview
Replaces slow Pandas loops and memory bottlenecks with Polars' multi-threaded Rust execution engine and Apache Arrow columnar layout.

## Lazy Frame Pipeline Pattern
```python
import polars as pl

# Construct lazy execution graph without loading 10GB into memory
lazy_query = (
    pl.scan_parquet("transactions_*.parquet")
    .filter(pl.col("status") == "COMPLETED")
    .group_by(["merchant_id", "currency"])
    .agg([
        pl.col("amount").sum().alias("total_volume"),
        pl.col("amount").mean().alias("avg_ticket"),
        pl.col("transaction_id").count().alias("tx_count")
    ])
    .sort("total_volume", descending=True)
)

# Execute streaming pipeline
result = lazy_query.collect(streaming=True)
```
