---
name: locust-distributed-load-testing
description: Python-driven distributed load testing with Locust, custom user behavior scripting, and multi-worker execution.
---

# Distributed Load Testing with Locust

## Overview
Scales load testing across multiple machines with code-defined Python user scenarios, dynamic payload generation, and real-time web dashboard analytics.

## Locustfile Architecture (locustfile.py)
```python
from locust import HttpUser, task, between
import random

class APIUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self):
        # Authenticate session
        res = self.client.post("/api/v1/auth/login", json={"email": "load@test.com", "pass": "secret"})
        self.token = res.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def view_catalog(self):
        self.client.get("/api/v1/products", headers=self.headers)

    @task(1)
    def create_checkout(self):
        payload = {"item_id": random.randint(1, 1000), "quantity": 1}
        self.client.post("/api/v1/orders", json=payload, headers=self.headers)
```

## Running Master & Worker Clusters
```bash
# Master node
locust -f locustfile.py --master

# Worker nodes
locust -f locustfile.py --worker --master-host=127.0.0.1
```
