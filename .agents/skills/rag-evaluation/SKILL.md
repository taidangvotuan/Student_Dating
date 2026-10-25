---
name: rag-evaluation
description: Systematic evaluation of Retrieval-Augmented Generation (RAG) pipelines measuring faithfulness, answer relevance, context recall, and precision.
---

# RAG Evaluation Framework

## Overview
Evaluates RAG retrieval and generation accuracy using standardized metrics (Ragas, TruLens, DeepEval) to eliminate hallucinations and low-relevance answers before production release.

## Core Evaluation Dimensions

1. **Faithfulness**: Is the answer strictly grounded in the retrieved context?
2. **Answer Relevance**: Does the answer directly address the user query without extraneous drift?
3. **Context Recall**: Did the retriever fetch all relevant chunks required to answer the prompt?
4. **Context Precision**: Are the highest-ranked chunks actually the most relevant signal?

## Workflow

### 1. Golden Evaluation Dataset
Assemble at least 30-50 ground-truth triples:
- `question`: User query.
- `ground_truth`: Human-verified authoritative answer.
- `contexts`: Ground-truth reference passages.

### 2. Metric Computation Pipeline
```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_recall,
    context_precision
)
from datasets import Dataset

def evaluate_rag_pipeline(test_dataset: Dataset):
    results = evaluate(
        test_dataset,
        metrics=[faithfulness, answer_relevancy, context_recall, context_precision]
    )
    print(results)
    # Threshold enforcement
    assert results['faithfulness'] >= 0.85, 'Hallucination rate exceeds threshold'
    assert results['answer_relevancy'] >= 0.80, 'Answer relevance below target'
    return results
```

### 3. Failure Mode Remediation
- **Low Recall**: Increase top_k, test hybrid search (BM25 + Dense vector), adjust chunk size.
- **Low Precision**: Implement reranker (Cohere, BGE-Reranker-v2), tune semantic chunking boundaries.
- **Low Faithfulness**: Enforce grounding system prompt, reduce temperature to 0.0, apply chain-of-thought verification.
