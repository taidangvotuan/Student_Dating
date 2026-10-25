---
name: advanced-git-internals-reflog-bisect
description: Advanced Git internals, recovering lost commits via reflog, binary bug hunting with git bisect, and object store inspection.
---

# Advanced Git Internals, Reflog & Bisect

## Overview
Recovers seemingly lost work from dangling commits (`git reflog`) and pinpoints the exact commit that introduced a regression in seconds (`git bisect`).

## Binary Bug Hunting with `git bisect`
```bash
git bisect start
git bisect bad                 # Current commit is broken
git bisect good v2.0.0         # Last known good release
git bisect run pytest tests/test_payment.py
# Git automatically checks out revisions and finds culprit commit
git bisect reset
```
