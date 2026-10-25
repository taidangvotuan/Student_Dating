---
name: react-19-actions-hooks
description: React 19 modern hooks and server action patterns including use(), useActionState, useOptimistic, and useFormStatus.
---

# React 19 Hooks & Server Actions

## Overview
Guides the implementation of React 19 core features, eliminating boilerplate state management for async data and mutations.

## References & Documentation
- Authoritative reference guide: `references/frontend/react-19-and-nextjs15-reference.md`
- React official docs: https://react.dev/reference/react

## The use() Hook for Conditional Promise Unwrapping
```tsx
import { use, Suspense } from 'react';

function UserCard({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Unwraps promise inline inside Suspense boundary
  return <h2>{user.name}</h2>;
}
```

## Form Actions with useActionState
```tsx
'use client';
import { useActionState } from 'react';
import { updateUserProfile } from '@/actions/profile';

export function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateUserProfile, { error: null });

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Save'}
      </button>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```
