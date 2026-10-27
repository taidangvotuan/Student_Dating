---
name: rag-advanced-chunking
description: Semantic chunking, recursive character splitting, parent-document retrieval, and hybrid dense/sparse search for RAG.
---

# Advanced RAG Document Chunking

## Overview
Optimizes context retrieval quality by segmenting text along logical semantic boundaries rather than arbitrary character splits.

## Chunking Strategies
1. **Semantic Boundary Chunking**: Split on paragraph breaks and semantic embedding distance changes.
2. **Parent Document Retrieval**: Embed small chunks (200 tokens) for precise search, but return the parent section (1,500 tokens) to the LLM context.
3. **Markdown-Aware Splitting**: Preserve table structures, code blocks, and markdown header hierarchies intact.
