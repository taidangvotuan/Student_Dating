---
name: cpp-modern-raii-concurrency
description: Modern C++ (C++20/C++23) standards, RAII resource management, smart pointers, coroutines, and thread safety.
---

# Modern C++ RAII & Concurrency

## Overview
Replaces manual `new`/`delete` and raw threads with smart pointers (`std::unique_ptr`), standard concurrency primitives, and RAII resource handles.

## Guidelines
- Never use raw owning pointers.
- Pass parameters by `std::string_view` or `std::span` to prevent unnecessary heap allocations.
