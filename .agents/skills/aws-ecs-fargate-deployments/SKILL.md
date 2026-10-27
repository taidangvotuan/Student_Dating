---
name: aws-ecs-fargate-deployments
description: Serverless container deployment with AWS ECS on Fargate, task definitions, capacity providers, and rolling deployments.
---

# AWS ECS on Fargate Container Deployments

## Overview
Runs production containers without managing underlying EC2 virtual machines, leveraging AWS Fargate serverless compute.

## Key Configurations
- **Capacity Provider**: Balance between `FARGATE` (production reliability) and `FARGATE_SPOT` (70% cost savings for worker tasks).
- **Graceful Termination**: Handle `SIGTERM` within 30 seconds to allow in-flight HTTP requests to complete cleanly.
