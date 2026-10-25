---
name: rust-unsafe-code-audit
description: Auditing and proving safety invariants in Rust `unsafe` blocks, Miri undefined behavior checks, and pointer aliasing.
---

# Rust Unsafe Code Auditing & Miri

## Overview
Strictly validates that any `unsafe` block in a Rust codebase satisfies all safety invariants without triggering undefined behavior.

## Verification with Miri
```bash
cargo +nightly miri test
```
- Ensures no out-of-bounds pointer offsets.
- Detects violating stacked borrows or unaligned memory access.
