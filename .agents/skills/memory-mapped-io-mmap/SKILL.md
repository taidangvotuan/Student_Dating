---
name: memory-mapped-io-mmap
description: Zero-copy disk I/O using POSIX mmap, shared memory segments, and virtual memory page fault handling.
---

# Memory-Mapped I/O (mmap) & Zero-Copy

## Overview
Maps large files (100GB+) directly into the process virtual address space, letting the OS kernel handle paging without intermediate user-space buffer copies.
