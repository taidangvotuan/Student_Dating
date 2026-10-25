---
name: pandas-vectorized-performance
description: High-performance Pandas programming, eliminating iterrows, leveraging NumPy vectorization, and categorical dtypes.
---

# Pandas Vectorization & Performance Tuning

## Overview
Eliminates 100x performance penalties in Python data processing by replacing iterative loops with vectorized columnar operations.

## Golden Rules
- ❌ **NEVER** use `for index, row in df.iterrows()` or `.apply()` with Python functions on large DataFrames.
- ✅ Use native NumPy/Pandas vectorized math (`df['c'] = df['a'] * df['b']`).
- ✅ Convert low-cardinality strings to `category` dtype to slash RAM usage by 80%.
