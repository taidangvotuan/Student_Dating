---
name: feature-store-feast
description: Centralized feature store management with Feast, unifying online low-latency inference and offline point-in-time correct training data.
---

# Feast Feature Store Architecture

## Overview
Prevents train/serve skew and feature leakage in production machine learning pipelines by serving features consistently across batch and real-time inference.

## Key Primitives
- **Entities**: Primary join keys (e.g. `user_id`, `device_id`).
- **Feature Views**: Definitions of features mapped to batch sources (Parquet/Snowflake) and online stores (Redis).
