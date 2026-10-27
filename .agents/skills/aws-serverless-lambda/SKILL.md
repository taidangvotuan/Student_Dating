---
name: aws-serverless-lambda
description: Serverless architectures on AWS Lambda, API Gateway v2, provisioned concurrency, and cold start optimization.
---

# AWS Lambda Serverless Engineering

## Overview
Designs resilient, scalable serverless applications on AWS Lambda while eliminating cold start penalties and runaway concurrency costs.

## Best Practices
- **Arm64 (Graviton)**: 20% cheaper and up to 19% faster than x86_64 for most runtime workloads.
- **Provisioned Concurrency**: Apply to high-traffic, latency-sensitive API Gateway routes to guarantee zero cold start.
- **Reserved Concurrency**: Set limits on lambdas reading from queues (SQS/Kinesis) to prevent overwhelming downstream databases.
