---
name: lighthouse-web-vitals-ci
description: Automated Core Web Vitals and Lighthouse audits in CI, enforcing budgets for LCP, CLS, FID, and INP.
---

# Lighthouse CI & Core Web Vitals Auditing

## Overview
Prevents frontend performance regressions by automatically running headless Chrome audits against pull requests.

## Key Web Vitals Thresholds
- **LCP (Largest Contentful Paint)**: ≤ 2.5 seconds.
- **CLS (Cumulative Layout Shift)**: ≤ 0.1.
- **INP (Interaction to Next Paint)**: ≤ 200 milliseconds.

## Configuration (.lighthouserc.json)
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run start"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```
