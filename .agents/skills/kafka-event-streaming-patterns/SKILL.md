---
name: kafka-event-streaming-patterns
description: Event-driven architecture with Apache Kafka, idempotent producers, dead-letter queues (DLQ), and partition key strategy.
---

# Kafka Event Streaming & Architecture Patterns

## Overview
Designs resilient, scalable event pipelines using Apache Kafka, ensuring message durability, ordered event processing, and fault tolerance.

## Core Production Rules
1. **Idempotent Producers**: Always configure `enable.idempotence=true` and `acks=all` to prevent duplicate writes during network retries.
2. **Partition Key Consistency**: Ensure events requiring strict order (e.g., account transactions) share the exact same partition key (`tenant_id` or `account_id`).
3. **Dead-Letter Queue (DLQ)**: Route unprocessable or poison-pill messages to a DLQ topic after 3 failed retries rather than halting the consumer.

## Producer Configuration Example (Java/JVM)
```properties
acks=all
enable.idempotence=true
retries=2147483647
max.in.flight.requests.per.connection=5
compression.type=zstd
```
