---
name: web-audio-api-dsp
description: Web Audio API digital signal processing, AudioWorklet threads, audio synthesis, and real-time spectrum visualization.
---

# Web Audio API & DSP Architecture

## Overview
Performs real-time digital audio synthesis, effects processing, and FFT frequency visualization in web applications without audio glitching.

## AudioWorklet for Low Latency
- Offload audio buffer processing from the main thread into dedicated `AudioWorkletProcessor` threads.
- Prevent UI garbage collection pauses from causing audio dropouts or pops.
