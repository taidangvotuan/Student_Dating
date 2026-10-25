---
name: supply-chain-dependency-audit
description: Securing open-source software supply chains, automated SBOM generation, dependency pinning, and typosquatting detection.
---

# Software Supply Chain Security & SBOM

## Overview
Guards codebases against malicious open-source packages, compromised npm/PyPI maintainer accounts, and vulnerable transitive dependencies.

## Key Controls
- Pin exact versions using lockfiles (`package-lock.json`, `poetry.lock`).
- Generate Software Bill of Materials (SBOM) using CycloneDX or Syft.
