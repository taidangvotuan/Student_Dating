---
name: langgraph-agent-workflows
description: Cyclical graph-based agent orchestration, state persistence, human-in-the-loop validation, and deterministic workflow routing.
---

# LangGraph & Cyclical Agent Workflows

## Overview
Builds multi-step, stateful, and cyclical agent workflows beyond simple linear chains.

## Key Primitives
- **StateGraph**: Typed dictionary or Pydantic state passed between nodes.
- **Nodes**: Python functions executing tasks or tool calls.
- **Conditional Edges**: Dynamic routing decisions based on output analysis.
- **Checkpointers**: Memory persistence (Postgres/Sqlite) enabling rewind, pause, and human review.

## Pattern Example
```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    plan: list[str]
    code: str
    review_status: str

def code_node(state: AgentState):
    # Generates or refactors code
    return {'code': '...'}

def review_node(state: AgentState):
    # Reviews code against criteria
    return {'review_status': 'PASS' if valid else 'FAIL'}

builder = StateGraph(AgentState)
builder.add_node('coder', code_node)
builder.add_node('reviewer', review_node)
builder.set_entry_point('coder')
builder.add_edge('coder', 'reviewer')
builder.add_conditional_edges(
    'reviewer',
    lambda s: 'coder' if s['review_status'] == 'FAIL' else END
)
app = builder.compile()
```
