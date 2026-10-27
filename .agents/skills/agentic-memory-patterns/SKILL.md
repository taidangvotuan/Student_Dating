---
name: agentic-memory-patterns
description: Working, episodic, and semantic memory architectures for autonomous multi-turn agents and long-running sessions.
---

# Agentic Memory Architecture

## Overview
Gives autonomous agents state continuity across extended conversations, multi-session tasks, and complex workflows.

## The 3 Tiers of Memory
1. **Working Memory (Scratchpad)**:
   - Resides in context window.
   - Holds active plan, immediate tool results, and scratch notes.
2. **Episodic Memory (Past Experiences)**:
   - Records past agent attempts, successes, failures, and user feedback.
   - Queryable by semantic similarity when facing a new problem.
3. **Semantic Memory (Long-term Knowledge)**:
   - Entity-relationship graph or knowledge base of domain rules, user preferences, and project facts.

## Pattern: Read-Reflect-Update
- Before executing a plan, query episodic memory: `What worked or failed previously on this task?`
- After completion, write a structured episode log:
```json
{
  "task_type": "migration",
  "strategy": "zero_downtime_dual_write",
  "outcome": "success",
  "lessons_learned": "Must wait for consumer lag to hit zero before switching reads."
}
```
