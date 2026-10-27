---
name: gcp-bigquery-cost-optimization
description: Google Cloud BigQuery cost control, partitioned and clustered tables, slot reservation, and BI Engine caching.
---

# GCP BigQuery Cost Optimization & Performance

## Overview
Cuts query scan costs by up to 90% by partitioning on ingestion dates and clustering on high-frequency filter columns.

## Table Optimization Example
```sql
CREATE TABLE `project.analytics.events`
(
    event_id STRING,
    user_id STRING,
    event_time TIMESTAMP,
    country STRING
)
PARTITION BY DATE(event_time)
CLUSTER BY country, user_id;
```
