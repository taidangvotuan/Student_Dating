---
name: local-llm-deployment
description: High-throughput local LLM hosting, quantization (GGUF, AWQ, FP8), and serving architectures using vLLM and Ollama.
---

# Local LLM Deployment & Serving

## Overview
Deploys open-weights models (Llama 3, Qwen 2.5, DeepSeek) locally or on private cloud infrastructure with minimal latency and maximal throughput.

## Serving Engines
- **vLLM**: Production serving with PagedAttention, continuous batching, and tensor parallelism.
- **Ollama**: Local workstation development, rapid testing, and lightweight edge hosting.

## Quantization Guide
- **FP8**: Best performance on Hopper / Ada Lovelace GPUs with virtually zero perplexity loss.
- **AWQ (4-bit)**: Optimal for high-throughput GPU serving with limited VRAM.
- **GGUF (Q4_K_M, Q5_K_M)**: Optimal for CPU / Apple Silicon (Metal) local execution.

## vLLM Production Launch Command
```bash
python3 -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-Coder-32B-Instruct \
    --tensor-parallel-size 2 \
    --gpu-memory-utilization 0.90 \
    --max-model-len 16384 \
    --port 8000
```
