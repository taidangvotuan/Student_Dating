---
name: token-optimization-tricks
description: Advanced token-saving protocols, context compaction, bounded pipes, and sandbox execution to maximize reasoning capacity.
---

# Token Optimization & Context Management

## Overview
Techniques to reduce token consumption by 60-80% without degrading reasoning quality or accuracy.

## Core Rules

1. **Think-in-Code via Sandbox (Context-Mode)**:
   - Run commands and inspect big logs, test suites, and data in sandbox pipes.
   - Only return the concise 5-line summary to context memory.
2. **Precision Slicing**:
   - Never dump entire files (>500 lines) into context. Use targeted line ranges (`StartLine` and `EndLine`).
3. **Prompt Compaction**:
   - Remove conversational filler words. Use concise imperative bullets.
4. **Schema Minimization**:
   - Strip redundant whitespace and keys from JSON schemas passed to LLMs.
5. **Context Trimming**:
   - Compact older conversation turns periodically. Keep active tasks and architectural decisions.
