---
name: circuit-breaker-resilience4j
description: Fault-tolerant circuit breakers, bulkheads, rate limiters, and retry patterns using Resilience4j and Polly.
---

# Circuit Breakers & Fault Tolerance

## Overview
Protects upstream services from cascading failure by automatically cutting off requests to degrading dependencies.

## Circuit Breaker States
- **CLOSED**: Normal operation; requests pass through.
- **OPEN**: Failure rate threshold exceeded (e.g. > 50% failures); requests fail fast immediately.
- **HALF-OPEN**: Probe state after wait duration; permits a small sample of test requests to evaluate recovery.

## Configuration Pattern (Java / Resilience4j)
```properties
resilience4j.circuitbreaker.instances.paymentService.slidingWindowSize=100
resilience4j.circuitbreaker.instances.paymentService.failureRateThreshold=50
resilience4j.circuitbreaker.instances.paymentService.waitDurationInOpenState=10s
resilience4j.circuitbreaker.instances.paymentService.permittedNumberOfCallsInHalfOpenState=10
```
