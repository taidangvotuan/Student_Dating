---
name: tauri-cross-platform-desktop
description: Lightweight native desktop applications with Tauri v2, Rust backend core, secure IPC commands, and minimal memory usage.
---

# Tauri Lightweight Desktop Development

## Overview
Replaces memory-heavy Electron runtimes (100MB+ RAM) with lightweight native webviews powered by a secure Rust backend (<30MB RAM, <10MB installer).

## Safe IPC Command Pattern (Rust)
```rust
#[tauri::command]
fn fetch_system_metrics() -> Result<SystemMetrics, String> {
    // Hardware metrics safely gathered in Rust
    Ok(gather_metrics())
}
```
