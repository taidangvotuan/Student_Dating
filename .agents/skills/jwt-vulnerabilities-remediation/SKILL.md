---
name: jwt-vulnerabilities-remediation
description: Remediation of JSON Web Token (JWT) vulnerabilities, algorithm confusion ('none'), key rotation, and secure cookie storage.
---

# JWT Vulnerability Remediation & Hardening

## Overview
Protects token-based authentication systems from algorithm downgrade attacks, weak symmetric keys, and token replay.

## Critical Security Controls
- **Explicit Algorithm Whitelist**: Strictly reject tokens with `alg: "none"` or unexpected algorithms.
- **Store in HttpOnly, Secure, SameSite Cookies**: Never store session JWTs in browser `localStorage` or `sessionStorage` where XSS can extract them.
