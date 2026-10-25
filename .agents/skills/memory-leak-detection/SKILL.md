---
name: memory-leak-detection
description: Systematic memory leak diagnosis, heap snapshot comparison, garbage collection profiling, and V8/JVM leak isolation.
---

# Memory Leak Detection & Heap Profiling

## Overview
Detects and isolates memory leaks in long-running Node.js, Go, or JVM backend services before they trigger OOM container crashes.

## Diagnostic Protocol
1. **Take Baseline Heap Snapshot**: Capture snapshot immediately after service startup and warmup.
2. **Apply Traffic Load**: Send 5,000 requests using a load testing tool (k6/autocannon).
3. **Take Secondary Heap Snapshot**: Capture snapshot after traffic ceases and garbage collection triggers.
4. **Compare Retained Sizes**: Identify object constructors with monotonically increasing retained sizes.

## Common Root Causes
- Unbounded global caches without TTL or eviction policies.
- Dangling event listeners (`EventEmitter.on`) never unregistered.
- Closures holding references to large request contexts.
