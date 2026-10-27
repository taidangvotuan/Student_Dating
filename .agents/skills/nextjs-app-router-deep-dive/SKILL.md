---
name: nextjs-app-router-deep-dive
description: Next.js 15 App Router architecture, parallel/intercepting routes, streaming SSR with Suspense, and Route Handlers.
---

# Next.js 15 App Router Architecture

## Overview
Deep architectural patterns for Next.js App Router, combining Server Components (RSC) with streaming Suspense and advanced routing.

## References
- Architectural reference: `references/frontend/react-19-and-nextjs15-reference.md`
- Next.js documentation: https://nextjs.org/docs/app

## Parallel Routes & Modal Interception Pattern
```
app/
├── feed/
│   ├── @modal/(.)photo/[id]/page.tsx  <-- Modal overlay on client route transition
│   ├── layout.tsx                     <-- Injects parallel slot: props.modal
│   └── page.tsx
└── photo/[id]/page.tsx                <-- Hard direct URL navigation
```
