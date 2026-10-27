---
name: c-modern-memory-safety
description: Modern C programming standards (C17/C23), avoiding buffer overflows, AddressSanitizer (ASan), and safe pointer arithmetic.
---

# Modern C & Memory Safety Engineering

## Overview
Eliminates classic C vulnerabilities (use-after-free, buffer overflows, dangling pointers) using strict compiler flags and AddressSanitizer.

## AddressSanitizer Build Flag
```bash
gcc -std=c17 -Wall -Wextra -Werror -fsanitize=address,undefined -g app.c -o app
```
