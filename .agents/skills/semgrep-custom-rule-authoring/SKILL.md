---
name: semgrep-custom-rule-authoring
description: Authoring custom Static Application Security Testing (SAST) rules using Semgrep to detect architectural violations and security anti-patterns.
---

# Custom Semgrep SAST Rule Authoring

## Overview
Enforces custom security boundaries and architectural rules in CI/CD using Semgrep's AST pattern matching without writing complex compiler plugins.

## Semgrep Rule Pattern (ban-direct-sql-exec.yaml)
```yaml
rules:
  - id: ban-unparameterized-db-query
    languages: [typescript, javascript]
    message: "Detected potential SQL injection: Direct string template in db.query(). Use parameterized prepared statements."
    severity: ERROR
    patterns:
      - pattern-either:
          - pattern: $DB.query(`...${$INPUT}...`)
          - pattern: $DB.execute(`...${$INPUT}...`)
      - pattern-not: $DB.query(`SELECT 1`)
```

## Running Semgrep in CI
```bash
semgrep scan --config .semgrep/ --error --strict
```
