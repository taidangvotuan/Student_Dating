---
name: jq-yq-advanced-json-yaml-wrangling
description: Advanced JSON and YAML processing with jq and yq, stream transformations, deep filtering, and in-place updates.
---

# Advanced JSON & YAML Wrangling (jq & yq)

## Overview
Extracts, transforms, and modifies complex JSON payloads and Kubernetes YAML manifests directly from the terminal.

## High-Utility jq Filters
```bash
# Extract user emails from nested paginated payload
curl -s https://api.corp.com/users | jq -r '.data[] | select(.active == true) | .email'
```
