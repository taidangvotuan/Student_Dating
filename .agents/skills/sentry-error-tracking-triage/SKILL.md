---
name: sentry-error-tracking-triage
description: Production exception tracking with Sentry, error grouping rules, fingerprinting, and release regression triage.
---

# Sentry Error Tracking & Exception Triage

## Overview
Captures unhandled exceptions across frontend, backend, and mobile applications with complete stack traces, user breadcrumbs, and release attribution.

## Custom Fingerprinting Pattern
Prevent alert noise and split distinct error causes into separate issues using fingerprinting:

```python
import sentry_sdk

def capture_api_error(err, status_code, endpoint):
    with sentry_sdk.push_scope() as scope:
        # Group by endpoint and status code rather than generic exception message
        scope.fingerprint = [endpoint, str(status_code)]
        scope.set_tag("api.endpoint", endpoint)
        sentry_sdk.capture_exception(err)
```
