---
name: docker-multi-stage-security
description: Production-hardened multi-stage Dockerfiles, minimal distroless base images, non-root user execution, and vulnerability scanning.
---

# Multi-Stage Secure Docker Containerization

## Overview
Builds lean, secure container images under 100MB by discarding build toolchains, executing under unprivileged users, and scanning with Trivy.

## Multi-Stage Pattern (Node.js / TypeScript)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --production

# Stage 2: Minimal Distroless Runtime
FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER nonroot:nonroot
EXPOSE 8080
ENV NODE_ENV=production
CMD ["dist/main.js"]
```

## Image Vulnerability Audit
```bash
trivy image --severity HIGH,CRITICAL my-app:latest
```
