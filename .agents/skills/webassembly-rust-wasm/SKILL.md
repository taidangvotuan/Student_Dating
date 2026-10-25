---
name: webassembly-rust-wasm
description: High-performance WebAssembly compilation from Rust, wasm-bindgen, memory allocation, and browser/edge interop.
---

# WebAssembly (Wasm) Architecture with Rust

## Overview
Compiles CPU-intensive Rust code into portable, safe WebAssembly binaries running at near-native speeds in browsers, Cloudflare Workers, and serverless runtimes.

## Minimal wasm-bindgen Export
```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fast_fourier_transform(samples: &[f32]) -> Vec<f32> {
    // Hardware-accelerated DSP in Rust
    compute_fft(samples)
}
```

## Compilation Pipeline
```bash
wasm-pack build --target web --release
```
