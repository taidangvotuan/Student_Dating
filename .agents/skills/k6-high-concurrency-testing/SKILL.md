---
name: k6-high-concurrency-testing
description: Load and performance testing using Grafana k6, defining virtual user ramp-ups, thresholds, and automated CI quality gates.
---

# High-Concurrency Load Testing with k6

## Overview
Simulates realistic production traffic with thousands of virtual users (VUs) to identify API bottlenecks, database connection pool exhaustion, and memory leaks before launch.

## Production Test Script Pattern (load_test.js)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up
    { duration: '1m', target: 200 },  // Peak load
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'], // 95% of requests must finish within 400ms
    http_req_failed: ['rate<0.01'],                 // Error rate must be under 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/v1/feed');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has items': (r) => JSON.parse(r.body).items.length > 0,
  });
  sleep(1);
}
```

## Running k6 in CI
```bash
k6 run --out json=results.json load_test.js
```
