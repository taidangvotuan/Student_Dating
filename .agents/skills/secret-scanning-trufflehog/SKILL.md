---
name: secret-scanning-trufflehog
description: Automated secret scanning in Git history and CI/CD pipelines using TruffleHog and Gitleaks to prevent credential leakage.
---

# Automated Secret Scanning (TruffleHog & Gitleaks)

## Overview
Detects high-entropy strings, leaked private keys, API tokens, and AWS credentials across git commit history and pull requests.

## Pre-Commit Hook Integration
```bash
# Run verified TruffleHog scan against git commits
trufflehog git file://. --since-commit HEAD~1 --fail
```
