---
name: tanstack-query-v5-caching
description: Advanced server state management with TanStack Query v5, Query Key Factories, optimistic updates, and SSR dehydration.
---

# TanStack Query v5 Caching & Mutations

## Overview
Manages asynchronous server data, background refetching, deduping, and optimistic cache mutations without replicating state.

## References & Cookbook
- Detailed cookbook: `references/frontend/tanstack-query-v5-cookbook.md`
- State matrix: `references/frontend/state-management-matrix.md`

## Query Key Factory Standard
```typescript
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (tag: string) => [...postKeys.lists(), { tag }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};
```
