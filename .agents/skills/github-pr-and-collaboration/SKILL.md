---
name: github-pr-and-collaboration
description: Master GitHub collaboration standards including Conventional Commits, branch naming, safe git push, pull request (PR) authoring, and semantic releases. Use when creating branches, staging and pushing commits, opening Pull Requests, formatting PR descriptions, or preparing releases.
---

# GitHub Collaboration, PR & Git Push Standards

Enforce professional Git collaboration, atomic conventional commits, safe branch push policies, and high-signal Pull Request (PR) authoring.

## When to Use
- Preparing commits before pushing to remote (`git commit`).
- Pushing feature branches and opening Pull Requests (`git push`, PR creation).
- Formatting PR descriptions with acceptance criteria and test evidence.
- Managing branch lifecycles and tagging semantic releases.

---

## 1. Branch Strategy & Naming Conventions

Never push code directly to the default branch (`main` or `master`). Use standardized branch prefixes:
- `feat/short-description` (e.g., `feat/jwt-authentication`)
- `fix/short-description` (e.g., `fix/order-timeout-null-pointer`)
- `refactor/short-description` (e.g., `refactor/user-service-deep-module`)
- `docs/short-description` (e.g., `docs/update-api-contracts`)
- `chore/short-description` (e.g., `chore/bump-dependencies`)

---

## 2. Conventional Commits Standard

Write atomic, descriptive commits following the Conventional Commits specification:
```text
<type>(<scope>): <short imperative summary>

[optional body explaining motivation and trade-offs]

[optional footer: Fixes #123, Breaking Changes]
```

### Types:
- `feat`: A new feature for the user.
- `fix`: A bug fix.
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `test`: Adding or correcting tests.
- `perf`: A code change that improves performance.
- `docs`: Documentation only changes.
- `chore`: Changes to build process, tooling, or auxiliary dependencies.

### Commit Rules:
- Keep the summary line under 72 characters.
- Use imperative mood ("add feature", not "added feature" or "adds feature").
- One logical concept per commit.

---

## 3. Safe Git Push Workflow

1. **Rebase on Latest Main**: Before pushing, pull latest main to avoid divergence:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. **Push to Remote Feature Branch**:
   ```bash
   git push -u origin feat/your-feature-name
   ```
3. **Guardrail**: NEVER run `git push --force` on shared or protected branches (`main`, `master`, `staging`). If you rebased your personal branch, use the safer flag:
   ```bash
   git push --force-with-lease
   ```

---

## 4. Pull Request (PR) Authoring Protocol

A great PR allows reviewers to understand context and approve with confidence. Always format the PR using `workflows/templates/PR-TEMPLATE.md`:
1. **Clear Title**: `feat(auth): implement JWT refresh token rotation`
2. **Context & Motivation**: Why is this change necessary?
3. **Key Changes**: Bullet list of architectural modifications.
4. **Verification & Proof**: Exact commands run, passing test logs, or UI screenshots.
5. **Issue Linking**: `Closes #42` or `Fixes #88` to enable automated GitHub issue closing.

---

## 5. Semantic Versioning & Release Tagging
When cutting a production release:
1. Follow SemVer: `v<MAJOR>.<MINOR>.<PATCH>`
   - `MAJOR`: Incompatible API breaking changes.
   - `MINOR`: Backwards-compatible new functionality.
   - `PATCH`: Backwards-compatible bug fixes.
2. Create signed or annotated tag:
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0: Added JWT auth and PostgreSQL migration"
   git push origin v1.2.0
   ```
