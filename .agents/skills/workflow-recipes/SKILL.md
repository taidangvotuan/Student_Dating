---
name: workflow-recipes
description: Guide and execute the 5 standard engineering workflows (Feature Development, Bugfix & Diagnosis, Codebase Refactoring & Deep Modules, Zero-Downtime Database Migration, Git Collaboration & Semantic Release). Use when the user asks which workflow to follow, how to run a feature/bugfix cycle, how to manage DB migrations, or how to handle releases.
---

# Standard Engineering Workflow Recipes

Execute structured, step-by-step engineering procedures from idea to deployment.

## The 5 Standard Workflows

1. **[Workflow 1: Standard Feature Development](file:///home/hien/Project/Agents-kit/workflows/recipes/01-feature-development-workflow.md)**
   - *Path*: Idea $\rightarrow$ Grilling $\rightarrow$ SRS Spec $\rightarrow$ DB Schema $\rightarrow$ Plan $\rightarrow$ TDD $\rightarrow$ Do-and-Judge Review $\rightarrow$ PR.
   - *Trigger*: User wants to build a new feature, endpoint, UI screen, or service.

2. **[Workflow 2: Bugfix & Root-Cause Diagnosis](file:///home/hien/Project/Agents-kit/workflows/recipes/02-bugfix-and-diagnosis-workflow.md)**
   - *Path*: Bounded Log Isolation $\rightarrow$ Red Failing Test $\rightarrow$ Root-Cause Analysis $\rightarrow$ Surgical Fix $\rightarrow$ Green Verification $\rightarrow$ PR.
   - *Trigger*: Sentry alert, user reports something broken or throwing errors.

3. **[Workflow 3: Codebase Refactoring & Deep Modules](file:///home/hien/Project/Agents-kit/workflows/recipes/03-refactoring-and-deep-modules-workflow.md)**
   - *Path*: Coupling Scan $\rightarrow$ Seam Identification $\rightarrow$ Characterization Tests $\rightarrow$ Stepwise Refactor $\rightarrow$ Boundary Enforcement.
   - *Trigger*: Untangling legacy spaghetti code, deepening module interfaces, breaking cyclic imports.

4. **[Workflow 4: Zero-Downtime Database Migration](file:///home/hien/Project/Agents-kit/workflows/recipes/04-database-migration-workflow.md)**
   - *Path*: Phase 1 Expand (Add nullable) $\rightarrow$ Phase 2 Dual-Write & Backfill $\rightarrow$ Phase 3 Switch Reads $\rightarrow$ Phase 4 Contract (Drop old).
   - *Trigger*: Modifying production database schemas without downtime or locked tables.

5. **[Workflow 5: Git Collaboration, Conflicts & Semantic Release](file:///home/hien/Project/Agents-kit/workflows/recipes/05-git-collaboration-and-release-workflow.md)**
   - *Path*: Branch Hygiene $\rightarrow$ Atomic Commits $\rightarrow$ Rebase on Main $\rightarrow$ 3-Way Conflict Resolution $\rightarrow$ PR $\rightarrow$ SemVer Tagging.
   - *Trigger*: Resolving merge/rebase conflicts, pushing branches, authoring PRs, creating releases.

---

## How to Select the Right Workflow

Ask:
- Are you **building something new**? $\rightarrow$ Use **Workflow 1**.
- Is something **broken or failing**? $\rightarrow$ Use **Workflow 2**.
- Is code **messy or tightly coupled**? $\rightarrow$ Use **Workflow 3**.
- Are you **modifying production data/tables**? $\rightarrow$ Use **Workflow 4**.
- Are you **resolving git conflicts or preparing a release**? $\rightarrow$ Use **Workflow 5**.
