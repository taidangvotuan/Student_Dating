---
name: aws-dynamodb-single-table-design
description: Amazon DynamoDB Single-Table Design, Composite Partition/Sort Keys (PK/SK), Global Secondary Indexes (GSI), and sparse indexes.
---

# AWS DynamoDB Single-Table Design

## Overview
Models entire application data models within a single DynamoDB table, providing predictable single-digit millisecond latency at any scale.

## Core Modeling Schema
- `PK`: `TENANT#<id>#USER#<id>`
- `SK`: `METADATA` or `ORDER#<date>#<id>`
- `GSI1PK`: Inverted access query patterns.
