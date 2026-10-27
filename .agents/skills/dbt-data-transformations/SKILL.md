---
name: dbt-data-transformations
description: Data build tool (dbt) modeling patterns, staging/marts architecture, modular SQL transforms, and automated schema tests.
---

# dbt Data Transformations & Modeling

## Overview
Enforces software engineering best practices in SQL data modeling with version control, modular DAG lineage, and automated testing.

## Model Layering Pattern
1. **`models/staging/` (`stg_*.sql`)**: 1-to-1 clean transformations of raw source tables (rename columns, cast types).
2. **`models/intermediate/` (`int_*.sql`)**: Complex joins, multi-step business logic, and window functions.
3. **`models/marts/` (`fct_*.sql`, `dim_*.sql`)**: Dimensional modeling (Star/Snowflake schema) consumed by BI tools.

## Schema Testing Example (schema.yml)
```yaml
version: 2
models:
  - name: fct_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: status
        tests:
          - accepted_values:
              values: ['placed', 'shipped', 'delivered', 'returned']
```
