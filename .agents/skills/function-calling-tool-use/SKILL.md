---
name: function-calling-tool-use
description: Resilient tool calling, strict schema enforcement (Pydantic/JSON Schema), error handling, and multi-turn function execution for AI agents.
---

# Function Calling & Tool Use Architecture

## Overview
Enables LLMs to interface reliably with external APIs, databases, and local runtimes. Guarantees schema adherence, recovers gracefully from model argument hallucinations, and prevents malformed tool executions.

## Key Rules
1. **Pydantic Strict Schemas**: Every tool must have typed, self-documenting parameters with field descriptions.
2. **Schema Sanitization**: Tool descriptions must specify clear boundaries and constraints.
3. **Execution Fallback**: If an LLM sends invalid arguments, return a structured error message to allow self-correction.

## Pattern Implementation
```python
from pydantic import BaseModel, Field
from typing import Literal

class DatabaseQueryTool(BaseModel):
    query: str = Field(description='Safe read-only SQL query without mutations')
    limit: int = Field(default=20, le=100, description='Max rows returned')
    format: Literal['json', 'csv'] = Field(default='json')

def execute_tool_safely(tool_call, registry):
    try:
        tool_cls = registry.get(tool_call.name)
        validated_args = tool_cls(**tool_call.arguments)
        return {'status': 'success', 'data': validated_args.run()}
    except Exception as e:
        # Feed back structured error to model for self-healing
        return {'status': 'error', 'message': f'Invalid arguments: {str(e)}. Please correct.'}
```
