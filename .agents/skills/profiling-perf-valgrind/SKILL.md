---
name: profiling-perf-valgrind
description: Linux system performance profiling with `perf`, flame graphs, and Valgrind Massif memory leak tracking.
---

# Systems Performance Profiling (perf & Valgrind)

## Overview
Identifies CPU bottlenecks, branch mispredictions, cache misses, and memory leaks down to the exact machine instruction.

## Flame Graph Generation
```bash
perf record -F 99 -g -- ./my_application
perf script | stackcollapse-perf.pl | flamegraph.pl > cpu_flamegraph.svg
```
