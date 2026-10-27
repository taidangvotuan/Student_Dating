---
name: ssrf-defense-architecture
description: Server-Side Request Forgery (SSRF) defense, internal IP blacklisting, metadata service protection, and forward proxy isolation.
---

# Server-Side Request Forgery (SSRF) Defense

## Overview
Prevents attackers from coercing backend servers into fetching internal network resources, cloud metadata APIs (`169.254.169.254`), or localhost ports.

## Defense Architecture
- **Deny Private IP Ranges**: Validate target URLs against RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.169.254`).
- **DNS Rebinding Prevention**: Resolve IP once and connect directly to the resolved IP rather than relying on domain name reuse.
