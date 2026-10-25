---
name: event-sourcing-cqrs
description: Event Sourcing and Command Query Responsibility Segregation (CQRS) architecture, append-only event logs, and read projections.
---

# Event Sourcing & CQRS Architecture

## Overview
Captures all business state changes as an immutable sequence of events, decoupling write validation from high-performance read model projections.

## Core Tenets
1. **Append-Only Event Store**: State changes are never updated or deleted in place. Every change is an append-only domain event.
2. **Projections**: Read databases (PostgreSQL, Redis, Elasticsearch) are asynchronously hydrated by replaying event streams.
3. **Auditability**: Complete historical reconstruction of any entity at any point in time.
