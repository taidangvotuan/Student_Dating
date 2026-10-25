---
name: onnx-model-export-inference
description: Exporting PyTorch and scikit-learn models to ONNX runtime for ultra-low latency, cross-platform hardware-accelerated serving.
---

# ONNX Runtime Model Serving & Inference

## Overview
Cuts model inference latency in half by compiling neural networks and tree models into an optimized open standard format executed on ONNX Runtime.

## PyTorch to ONNX Export
```python
import torch

dummy_input = torch.randn(1, 3, 224, 224, device='cuda')
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
)
```
