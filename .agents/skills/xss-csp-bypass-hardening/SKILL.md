---
name: xss-csp-bypass-hardening
description: Defending against Cross-Site Scripting (XSS), strict Content Security Policy (CSP) headers, nonce-based script execution, and DOMPurify.
---

# XSS Defense & Strict Content Security Policy (CSP)

## Overview
Eliminates Stored, Reflected, and DOM-based Cross-Site Scripting through output encoding, HTML sanitization, and strict CSP headers.

## Strict Nonce-Based CSP Header
```http
Content-Security-Policy: default-src 'self'; script-src 'nonce-rAnd0m123' 'strict-dynamic'; object-src 'none'; base-uri 'none';
```
