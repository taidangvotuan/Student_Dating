---
name: cache-friendly-data-layouts
description: Hardware cache line optimization, Structure of Arrays (SoA) vs Array of Structures (AoS), and false sharing mitigation.
---

# Cache-Friendly Data Layouts (Data-Oriented Design)

## Overview
Maximizes CPU L1/L2/L3 cache hit rates and eliminates memory bus stalls by arranging data sequentially in memory.

## Guidelines
- Avoid linked lists and scattered pointer trees for high-frequency loops; prefer contiguous arrays (`std::vector`).
- Prevent False Sharing: Ensure concurrent atomic counters reside on separate 64-byte cache lines.
