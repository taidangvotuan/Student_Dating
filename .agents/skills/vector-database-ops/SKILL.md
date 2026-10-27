---
name: vector-database-ops
description: Production vector database design, HNSW index optimization, similarity metrics, metadata filtering, and high-performance querying (pgvector, Qdrant, Pinecone).
---

# Vector Database Operations & Indexing

## Overview
Guides the schema design, indexing strategies, and similarity distance selection for scalable vector retrieval systems.

## Key Vector Index Structures

- **HNSW (Hierarchical Navigable Small World)**:
  - Best for: Low latency, high recall (>95%).
  - Tuning parameters:
    - `m`: Number of bidirectional links per vector (typically 16-64).
    - `ef_construction`: Search depth during build (typically 64-256).
    - `ef_search`: Search depth during query (typically 32-128).
- **IVFFlat**:
  - Inverted file index with cluster centroids. Lower memory footprint than HNSW, but requires periodic re-indexing when data grows.

## Distance Metric Selection
- **Cosine Similarity**: When embeddings are not normalized or directional angle matters.
- **Dot Product (Inner Product)**: Fastest when vectors are strictly unit-normalized (|v| = 1).
- **Euclidean (L2)**: Physical Euclidean distance.

## Production SQL Example (pgvector)
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table schema with hybrid search columns
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    embedding vector(1536) NOT NULL
);

-- Partitioned / Filtered HNSW Index
CREATE INDEX idx_doc_embeddings_hnsw ON document_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Query with metadata pre-filtering
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM document_embeddings
WHERE tenant_id = $2
ORDER BY embedding <=> $1
LIMIT 10;
```
