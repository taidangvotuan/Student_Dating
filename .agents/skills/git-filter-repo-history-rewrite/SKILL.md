---
name: git-filter-repo-history-rewrite
description: Safe Git history rewriting using git-filter-repo, purging accidentally committed passwords and large binary blobs.
---

# Git History Rewriting with git-filter-repo

## Overview
Permanently purges sensitive secrets, API keys, or multi-gigabyte accidental media files from the entire repository git object history.

## Purging Credentials
```bash
git filter-repo --replace-text expressions.txt --force
git filter-repo --strip-blobs-bigger-than 50M
```
