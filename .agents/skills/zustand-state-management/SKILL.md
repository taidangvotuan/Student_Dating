---
name: zustand-state-management
description: Lightweight, selector-optimized global client state management using Zustand, slices pattern, and persist middleware.
---

# Zustand Global Client State

## Overview
Scalable client-side state management without the bloat of Redux or the unnecessary re-render penalties of React Context.

## Slices Pattern Implementation
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<UISlice>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'app-storage', storage: createJSONStorage(() => localStorage) }
  )
);
```
