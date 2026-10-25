---
name: elasticsearch-search-indexing
description: High-performance search index design, custom analyzers, autocomplete edge n-grams, and search query tuning in Elasticsearch.
---

# Elasticsearch Indexing & Full-Text Search

## Overview
Builds fast, accurate full-text search systems, autocomplete features, and faceted search navigation.

## Analyzer Configuration
```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "edge_ngram_filter"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15
        }
      }
    }
  }
}
```
