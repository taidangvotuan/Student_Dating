---
name: hermes-engine-optimization
description: Optimizing React Native performance with Hermes JavaScript engine bytecode precompilation and memory profiling.
---

# Hermes Engine Optimization & Profiling

## Overview
Reduces mobile app Time-To-Interactive (TTI), lowers memory footprints, and shrinks binary size using the Hermes JavaScript engine.

## Hermes Optimization Flags (app.json)
```json
{
  "expo": {
    "jsEngine": "hermes",
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true,
            "extraProguardRules": "-keep class com.facebook.hermes.** { *; }"
          }
        }
      ]
    ]
  }
}
```

## Performance Tracking
- Profile CPU samples via Chrome DevTools connecting to Hermes CDT agent.
- Ensure all heavy data transformation is offloaded to native background threads.
