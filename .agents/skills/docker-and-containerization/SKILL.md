---
name: docker-and-containerization
description: Author optimized multi-stage Dockerfiles, compose multi-service environments (app, db, cache, proxy), and harden container security. Use when containerizing applications, writing Dockerfile, docker-compose.yml, optimizing Docker build cache, or hardening container environments.
---

# Docker & Containerization Best Practices

Build production-grade, secure, and lightweight container images with fast build cache and reliable orchestration.

## When to Use
- Packaging any service (Node.js, Python, Java, Go) for deployment or local development.
- Writing or refactoring `Dockerfile` and `docker-compose.yml`.
- Optimizing slow build times or bloated image sizes.
- Hardening container security (non-root users, vulnerability scans).

---

## Core Rules for Production Dockerfiles

### 1. Multi-Stage Builds (Separate Build from Runtime)
Always separate the heavy build environment (compilers, build tools, devDependencies) from the lean runtime container:
- Stage 1 (`builder`): Compiles code, runs tests, installs all dependencies.
- Stage 2 (`runner`): Copies ONLY built artifacts and production runtime dependencies into a minimal base image (e.g., `alpine`, `distroless`, or `-slim`).

### 2. Maximize Layer Cache Efficiency
Docker caches layers from top to bottom. Order directives from **least frequently changed** to **most frequently changed**:
```dockerfile
# 1. System dependencies (rarely changes)
RUN apk add --no-cache curl

# 2. Package manifest (changes occasionally)
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 3. Application source code (changes frequently)
COPY . .
```

### 3. Container Security Hardening
- **Never Run as Root**: Create and switch to a non-privileged user:
  ```dockerfile
  RUN addgroup -S appgroup && adduser -S appuser -G appgroup
  USER appuser
  ```
- **Proper `.dockerignore`**: Always exclude `.git`, `node_modules`, `.env*`, `__pycache__`, `target/`, and build artifacts.
- **Use Specific Base Image Tags**: Pin SHA or exact versions (`node:20.12.0-alpine3.19`), never use `latest`.

### 4. Robust `docker-compose.yml` Standard
Ensure all multi-container setups define:
1. `healthcheck`: Test service availability with curl or pg_isready.
2. `depends_on`: Use `condition: service_healthy` to prevent race conditions during startup.
3. `restart: unless-stopped`.
4. Named persistent volumes for databases.
5. Internal bridge networks isolating database traffic from the host.

## Output Deliverables
Produce:
1. `Dockerfile` and `.dockerignore`.
2. `docker-compose.yml` for local orchestration.
3. Refer to `workflows/templates/DOCKERFILE-PATTERNS.md` for language-specific templates.
