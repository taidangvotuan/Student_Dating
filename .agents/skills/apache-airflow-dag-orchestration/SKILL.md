---
name: apache-airflow-dag-orchestration
description: Authoring resilient Apache Airflow DAGs, TaskFlow API, idempotency, backfilling, and dynamic task mapping.
---

# Apache Airflow DAG Orchestration

## Overview
Schedules and monitors complex multi-system data pipelines with guaranteed idempotency, automatic retries, and failure alerts.

## Modern TaskFlow DAG Pattern
```python
from airflow.decorators import dag, task
from datetime import datetime, timedelta

@dag(
    schedule_interval='@daily',
    start_date=datetime(2026, 1, 1),
    catchup=False,
    default_args={'retries': 3, 'retry_delay': timedelta(minutes=5)}
)
def etl_pipeline():
    @task
    def extract() -> list[dict]:
        return [{"id": 1, "value": 100}]

    @task
    def transform(records: list[dict]) -> list[dict]:
        return [{"id": r["id"], "scaled": r["value"] * 1.5} for r in records]

    @task
    def load(processed: list[dict]):
        print(f"Loaded {len(processed)} rows into warehouse")

    load(transform(extract()))

pipeline = etl_pipeline()
```
