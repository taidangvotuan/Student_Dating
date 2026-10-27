---
name: owasp-top-10-mitigation
description: Comprehensive defense against the OWASP Top 10 web vulnerabilities with verified code patterns and mitigation controls.
---

# OWASP Top 10 Comprehensive Mitigation

## Overview
Hardens web applications against Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, and Vulnerable Components.

## Core Defense Matrix
1. **Broken Access Control**: Enforce ownership checks on every database record lookup (`WHERE id = :id AND tenant_id = :tenant_id`).
2. **Cryptographic Failures**: Use Argon2id or bcrypt (cost factor 12) for passwords; enforce TLS 1.3 only.
3. **Injection**: Strictly mandate parameterized SQL queries and typed ORM bindings.
