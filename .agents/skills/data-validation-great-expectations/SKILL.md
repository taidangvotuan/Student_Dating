---
name: data-validation-great-expectations
description: Automated data quality contracts using Great Expectations, preventing pipeline failures and silent schema drifts.
---

# Data Quality Contracts with Great Expectations

## Overview
Establishes declarative assertions for input datasets to stop corrupt or null-heavy data before it enters downstream ML models or dashboards.

## Core Expectations
- `expect_column_values_to_not_be_null`
- `expect_column_values_to_be_between`
- `expect_column_values_to_match_regex`
- `expect_table_row_count_to_be_between`
