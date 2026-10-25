---
name: kafka-consumer-group-tuning
description: Kafka consumer group tuning, rebalance mitigation, max poll intervals, and manual offset commit strategies.
---

# Kafka Consumer Group Performance & Tuning

## Overview
Prevents consumer lag spikes and expensive cluster rebalances by optimizing fetch batching, poll intervals, and thread pools.

## Critical Tuning Parameters
- `max.poll.interval.ms`: Maximum time a consumer can process a batch before the coordinator marks it dead (set higher than worst-case batch processing time).
- `max.poll.records`: Limit batch size (e.g., 100-500 records) to keep processing loops within poll intervals.
- `heartbeat.interval.ms`: Set to 1/3 of `session.timeout.ms`.

## Offset Commit Strategy
Use manual synchronous commits (`commitSync`) after committing downstream database transactions, or manual asynchronous commits (`commitAsync`) with error callbacks to prevent duplicate processing.
