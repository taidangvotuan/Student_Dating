---
name: ssh-tunneling-bastion-hardening
description: Secure SSH tunneling, local/remote port forwarding, SOCKS5 dynamic proxies, and hardened bastion jump hosts.
---

# Secure SSH Tunneling & Bastion Hardening

## Overview
Securely accesses private cloud databases and internal web services over encrypted SSH tunnels.

## Local Port Forwarding Pattern
```bash
# Forward local port 5433 directly to private RDS Postgres via bastion
ssh -N -L 5433:private-rds.corp.internal:5432 user@bastion.corp.com
```
