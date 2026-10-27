---
name: git-worktree-multi-branch-isolation
description: Working on multiple git branches simultaneously using git worktree without stashing or context switching.
---

# Git Worktrees for Parallel Development

## Overview
Enables checking out and working on multiple branches simultaneously in isolated directories from a single shared `.git` repository clone.

## Creating a Worktree
```bash
git worktree add ../feature-auth-branch -b feature/auth
cd ../feature-auth-branch
# Full working directory without disturbing original branch
```
