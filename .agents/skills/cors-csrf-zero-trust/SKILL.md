---
name: cors-csrf-zero-trust
description: Hardening Cross-Origin Resource Sharing (CORS) and Cross-Site Request Forgery (CSRF) defenses with SameSite cookies and Anti-CSRF tokens.
---

# CORS & CSRF Zero-Trust Architecture

## Overview
Prevents malicious third-party origins from reading sensitive response data or executing unauthorized state mutations on behalf of authenticated users.

## Anti-Patterns to Ban
- ❌ `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`.
- ❌ Reflecting the incoming `Origin` header blindly without an exact whitelist match.
