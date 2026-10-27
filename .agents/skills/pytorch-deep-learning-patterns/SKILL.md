---
name: pytorch-deep-learning-patterns
description: PyTorch production model architecture, custom Dataset/DataLoader, distributed data parallel (DDP), and mixed-precision training.
---

# PyTorch Deep Learning Engineering

## Overview
Designs robust neural network pipelines with PyTorch, optimizing GPU memory utilization, reproducibility, and training throughput.

## AMP (Automatic Mixed Precision) Training Loop
```python
import torch
from torch.cuda.amp import GradScaler, autocast

scaler = GradScaler()

for inputs, targets in dataloader:
    inputs, targets = inputs.cuda(), targets.cuda()
    optimizer.zero_grad(set_to_none=True) # Saves memory over zero_grad()

    with autocast(dtype=torch.float16):
        outputs = model(inputs)
        loss = criterion(outputs, targets)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```
