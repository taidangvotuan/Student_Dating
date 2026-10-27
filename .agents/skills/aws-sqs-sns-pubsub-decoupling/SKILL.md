---
name: aws-sqs-sns-pubsub-decoupling
description: Asynchronous service decoupling using AWS SNS fanout to SQS queues, dead-letter queues, and FIFO ordering.
---

# AWS SNS & SQS Fanout Architecture

## Overview
Decouples producers and consumers using SNS topic broadcasts to multiple SQS queues with at-least-once or exactly-once (FIFO) delivery guarantees.
