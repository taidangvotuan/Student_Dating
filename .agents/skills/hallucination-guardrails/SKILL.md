---
name: hallucination-guardrails
description: Guardrail architectures, semantic boundary enforcement, citation checks, and deterministic validation for LLM outputs.
---

# Hallucination Guardrails & Output Validation

## Overview
Eliminates unsupported claims, confabulations, and schema drift in LLM generation through pre- and post-generation guardrails.

## Guardrail Layers

1. **Input Guardrail**:
   - Detect prompt injection or jailbreak attempts.
   - Block out-of-scope domain queries early.
2. **Output Structure Guardrail**:
   - JSON Schema / Regex parser enforcement with strict pydantic validation.
3. **Grounding & Citation Guardrail**:
   - Extract entity claims from the generated response.
   - Cross-check each claim against the retrieved reference context chunks.
   - If citation support is < 0.90, reject or regenerate with strict instruction.
