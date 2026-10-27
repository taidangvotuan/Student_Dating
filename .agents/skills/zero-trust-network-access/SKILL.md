---
name: zero-trust-network-access
description: Zero Trust architecture, Cloudflare Tunnels (cloudflared), mutual TLS (mTLS), and identity-aware internal access.
---

# Zero Trust Network Access (ZTNA)

## Overview
Eliminates legacy VPN bottlenecks by exposing internal services securely via outbound-only reverse tunnels and mutual TLS authentication.

## Cloudflare Tunnel Pattern
- No open inbound firewall ports.
- Service communicates only via outbound connections to Cloudflare Edge.
- Access protected by SSO (Okta, Google Workspace) and device posture checks.
