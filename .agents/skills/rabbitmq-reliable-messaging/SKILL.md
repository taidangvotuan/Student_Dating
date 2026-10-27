---
name: rabbitmq-reliable-messaging
description: Reliable message broker architectures using RabbitMQ, Direct/Topic/Fanout exchanges, publisher confirms, and manual acks.
---

# RabbitMQ Reliable Messaging Architecture

## Overview
Lightweight, flexible message queuing for decoupled asynchronous task execution, background jobs, and microservice workflows.

## Exchange Topology
- **Direct Exchange**: Point-to-point task queues matched on exact routing keys.
- **Topic Exchange**: Publish-subscribe with wildcards (`order.*.created`, `*.audit`).
- **Fanout Exchange**: Broadcast messages to all bound consumer queues simultaneously.

## Zero Message Loss Checklist
- [ ] Queues declared as `durable: true`.
- [ ] Messages published with `delivery_mode: 2` (persistent).
- [ ] Publisher confirms enabled.
- [ ] Consumers use explicit manual acknowledgments (`channel.basic_ack`).
