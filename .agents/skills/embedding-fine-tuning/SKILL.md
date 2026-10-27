---
name: embedding-fine-tuning
description: Domain-specific embedding model fine-tuning with contrastive loss (MultipleNegativesRankingLoss) to maximize search recall.
---

# Domain Embedding Fine-Tuning

## Overview
Customizes embedding models for specialized vocabularies (legal, medical, proprietary codebase AST) when off-the-shelf embeddings fail to capture domain relevance.

## Training Pipeline
1. **Data Prep**: Triplet pairs `(anchor, positive, hard_negative)`.
2. **Loss Function**: `MultipleNegativesRankingLoss` (MNRL) using in-batch negatives.
3. **Evaluation**: Hit@K and MRR@10 against a held-out query-document evaluation set.
