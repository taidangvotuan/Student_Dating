---
name: monorepo-turborepo-orchestration
description: High-speed monorepo orchestration with Turborepo and pnpm workspaces, remote build caching, and pruned Docker builds.
---

# Turborepo Monorepo Architecture

## Overview
Accelerates large multi-package codebases with parallel build pipelines and remote computation caching.

## Turbo Pipeline Config (turbo.json)
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```
