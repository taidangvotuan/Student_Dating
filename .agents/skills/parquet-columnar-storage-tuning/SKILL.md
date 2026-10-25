---
name: parquet-columnar-storage-tuning
description: Apache Parquet file format optimization, row group sizing, dictionary encoding, and compression codec selection (Snappy, ZSTD).
---

# Parquet Storage Optimization & Tuning

## Overview
Reduces query scan times by 70% and storage costs by 80% through optimal Parquet layout, dictionary encoding, and statistics indexing.

## Best Practices
- **Row Group Size**: Set between 128MB and 512MB for high-throughput parallel engines (DuckDB, Spark, Trino).
- **Compression**: Use `ZSTD` (level 3) for the optimal balance of high compression ratio and fast decompression speeds.
- **Sorting Columns**: Sort data by high-cardinality filter columns before writing to maximize Parquet min/max page skipping.
