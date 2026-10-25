---
name: contract-testing-pact
description: Consumer-Driven Contract testing with Pact, eliminating integration surprises and preventing breaking API releases.
---

# Consumer-Driven Contract Testing with Pact

## Overview
Enables frontend and backend teams to evolve APIs independently by capturing contract expectations in versioned JSON pact files verified in CI.

## Workflow
1. **Consumer (Frontend/Client)**: Defines expected requests and responses in unit tests, generating a contract pact file.
2. **Pact Broker**: Shares and versions contracts between services.
3. **Provider (Backend/Service)**: Replays contracts against the API implementation to verify compliance before deployment.

## Benefit
Replaces slow, brittle end-to-end integration environments with fast, isolated unit contract tests.
