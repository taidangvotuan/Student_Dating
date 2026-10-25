---
name: canvas-high-fps-rendering
description: High-performance 2D HTML5 Canvas rendering, double buffering, dirty rectangle clearing, and OffscreenCanvas workers.
---

# High-FPS HTML5 Canvas Optimization

## Overview
Renders 100,000+ interactive 2D data points or diagram nodes at locked 60/120fps.

## Techniques
- **OffscreenCanvas**: Offload canvas rendering to a Web Worker thread to keep the main UI thread 100% responsive.
- **Batch Path Drawing**: Group similar strokes and fills into a single `beginPath() / stroke()` call.
