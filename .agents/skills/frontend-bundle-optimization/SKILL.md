---
name: frontend-bundle-optimization
description: Minimizing JavaScript bundles, tree-shaking, code-splitting with dynamic import(), and bundle analyzer diagnostics.
---

# Frontend Bundle Optimization & Code Splitting

## Overview
Maintains sub-100KB initial JavaScript bundles by auditing dependency graphs, eliminating bloated libraries (Moment.js, Lodash), and splitting routes.

## Dynamic Import Pattern
```tsx
import dynamic from 'next/dynamic';

// Heavy chart component only loaded when rendered
const HeavyAnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-neutral-100" />
});
```
