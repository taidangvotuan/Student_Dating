---
name: prompt-engineering-evals
description: Automated regression testing and continuous evaluation for LLM prompts, ensuring deterministic outputs and preventing prompt drift.
---

# Prompt Engineering & Regression Evaluations

## Overview
Treat prompts as mission-critical production software. Never deploy prompt adjustments without running automated assertions and semantic similarity checks against a versioned test suite.

## The Prompt Evaluation Loop

```
[Draft Prompt] -> [Run Matrix Against Test Suite] -> [Assert Output Schema & Semantics] -> [Compare Cost/Latency] -> [Merge/Deploy]
```

## Implementation Patterns

### 1. Deterministic Output Assertions
```python
import json
import pytest

def test_json_structure_and_keys(llm_client, system_prompt, sample_input):
    response = llm_client.generate(system_prompt=system_prompt, user_prompt=sample_input)
    data = json.loads(response)
    
    assert 'summary' in data
    assert 'confidence_score' in data
    assert 0.0 <= data['confidence_score'] <= 1.0
    assert len(data['summary']) < 300
```

### 2. LLM-as-a-Judge Semantic Graders
For non-deterministic creative text, use an automated judge prompt:
- **Criteria**: Coherence, tone alignment, safety, constraint adherence.
- **Grading Scale**: Binary PASS/FAIL with explicit negative reasoning.

## Best Practices
- Freeze model versions (e.g., `gpt-4o-2024-08-06`, `gemini-1.5-pro-002`) rather than using floating tags.
- Maintain regression test matrices in version-controlled YAML files.
- Track token burn and p95 latency alongside semantic accuracy.
