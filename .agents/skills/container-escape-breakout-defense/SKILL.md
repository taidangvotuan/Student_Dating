---
name: container-escape-breakout-defense
description: Hardening Docker and Kubernetes against container breakout attacks, capability drops, seccomp profiles, and rootless containers.
---

# Container Escape & Breakout Defense

## Overview
Prevents attackers who compromise a containerized process from gaining root access to the underlying Linux host kernel.

## Non-Negotiable Hardening Flags
```yaml
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 10001
  capabilities:
    drop:
      - ALL
  seccompProfile:
    type: RuntimeDefault
```
