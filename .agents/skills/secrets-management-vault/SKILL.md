---
name: secrets-management-vault
description: Secure secrets management using HashiCorp Vault, dynamic database credentials, and secret rotation patterns.
---

# Enterprise Secrets Management & Vault

## Overview
Eliminates static hardcoded credentials across cloud environments through short-lived dynamic tokens, automated rotation, and centralized auditing.

## Anti-Patterns to Ban
- ❌ Committing `.env` files into source control.
- ❌ Baking API keys into Docker images.
- ❌ Sharing single permanent database passwords across multiple microservices.

## Dynamic Database Credentials Workflow
1. Microservice requests database credentials via Vault Kubernetes Auth.
2. Vault generates an ephemeral PostgreSQL user with a 1-hour TTL.
3. Vault automatically revokes the user after 1 hour if not renewed.
