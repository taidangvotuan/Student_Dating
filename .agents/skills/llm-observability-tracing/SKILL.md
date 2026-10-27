---
name: llm-observability-tracing
description: Distributed tracing, token cost accounting, latency attribution, and failure tracking for multi-step LLM and agent workflows.
---

# LLM Observability & Distributed Tracing

## Overview
Production visibility into compound AI systems. Captures inputs, outputs, tool calls, token usage, cost, and latency bottlenecks across multi-agent executions.

## Telemetry Standards
- OpenTelemetry GenAI Semantic Conventions.
- Standard trace attributes:
  - `gen_ai.system`: `openai`, `anthropic`, `gemini`.
  - `gen_ai.request.model`: Target model string.
  - `gen_ai.usage.prompt_tokens`: Input tokens consumed.
  - `gen_ai.usage.completion_tokens`: Output tokens generated.
  - `gen_ai.request.temperature`: Generation temperature.

## Implementation Pattern (OpenLLMetry / LangSmith)
```python
from traceloop.sdk import Traceloop
from traceloop.sdk.decorators import workflow, task

Traceloop.init(app_name='agent-service', disable_batch=False)

@task(name='retrieve_context')
def fetch_chunks(query: str):
    # Vector DB lookup with automatic span instrumentation
    pass

@workflow(name='agent_execution_pipeline')
def run_agent(user_query: str):
    chunks = fetch_chunks(user_query)
    # LLM inference automatically wrapped in OpenTelemetry spans
```

## Monitoring & Alerting Thresholds
- **Token Spike Alerts**: Single request exceeding 25,000 tokens.
- **Error Spikes**: 429 (Rate Limit) or 503 (Provider Overload) > 1% in 5 minutes.
- **Latency Degrade**: p95 LLM response time exceeding 4.0 seconds.
