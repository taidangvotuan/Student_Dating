---
name: cuda-gpu-memory-optimization
description: CUDA GPU memory profiling, avoiding Out-Of-Memory (OOM) errors, gradient checkpointing, and FlashAttention utilization.
---

# CUDA Memory Optimization & Profiling

## Overview
Maximizes batch sizes and prevents PyTorch CUDA Out-of-Memory (OOM) exceptions on GPU compute clusters.

## High-Impact Techniques
1. **FlashAttention-2**: Replaces standard quadratic attention with fused GPU SRAM-aware kernels (reducing memory by 5-10x).
2. **Gradient Checkpointing**: Trades 20% compute time to save 60% GPU VRAM by recomputing activations during backward pass.
3. **Empty Cache**: Clear fragmentation when transitioning phases via `torch.cuda.empty_cache()`.
