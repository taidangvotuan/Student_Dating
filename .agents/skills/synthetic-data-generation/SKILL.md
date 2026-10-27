---
name: synthetic-data-generation
description: High-quality synthetic dataset generation, distillation, deduplication, and quality filtering for fine-tuning and benchmark creation.
---

# Synthetic Data Generation & Distillation

## Overview
Scales training data and evaluation benchmarks when real user data is scarce, privacy-restricted, or biased.

## Pipeline Architecture
1. **Seed Generation**: Curate 20-50 high-variance golden seed examples.
2. **Evolution (Evol-Instruct)**:
   - Deepen complexity (add domain constraints, multi-step dependencies).
   - Broaden scenarios (introduce edge cases, unusual inputs).
3. **Deduplication**:
   - MinHash LSH or dense embedding cosine similarity threshold (remove any pair with similarity > 0.92).
4. **Quality Filtering**:
   - Rule-based checks (length, formatting, regex).
   - LLM-as-a-judge score (reject any item with score < 8/10).
