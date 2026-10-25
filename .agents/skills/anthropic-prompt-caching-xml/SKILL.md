---
name: anthropic-prompt-caching-xml
description: Anthropic Claude official prompt caching standards, hierarchical XML tag parsing (<context>, <thinking>), and 5-minute cache breakpoint optimization.
---

# Anthropic Claude Prompt Caching & XML Hierarchy

## Overview
Reduces LLM API latency by up to 80% and token costs by up to 90% by exploiting Anthropic's 5-minute ephemeral prompt cache and structured XML tags.

## Core Rules
1. **XML Hierarchy**: Wrap inputs, instructions, and schemas in unambiguous XML tags (`<system_instructions>`, `<user_context>`, `<documents>`).
2. **Cache Breakpoints (`cache_control`)**: Place cache breakpoints (`{"type": "ephemeral"}`) at the end of static multi-turn prefixes (tools list, system instructions, reference codebase).
3. **Deterministic Thinking**: Use `<thinking>` blocks to allow deep reasoning scratchpads before delivering `<answer>`.

## Prompt Caching API Example (Python Anthropic SDK)
```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=4096,
    system=[
        {
            "type": "text",
            "text": "You are an elite code reviewer adhering to strict SOLID and TDD principles.",
        },
        {
            "type": "text",
            "text": "<reference_documentation>
" + massive_codebase_context + "
</reference_documentation>",
            # Cache this 50,000 token documentation block for subsequent calls
            "cache_control": {"type": "ephemeral"}
        }
    ],
    messages=[
        {"role": "user", "content": "Review src/auth/service.py for security vulnerabilities"}
    ]
)

print(f"Cache created tokens: {response.usage.cache_creation_input_tokens}")
print(f"Cache read tokens:    {response.usage.cache_read_input_tokens}")
```
