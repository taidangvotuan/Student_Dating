---
name: astro-island-architecture
description: High-performance content sites with Astro Islands, partial hydration directives (client:load, client:visible), and zero-JS baselines.
---

# Astro Island Architecture

## Overview
Renders HTML statically on the server by default (0 KB JS), hydrating only interactive component islands when needed.

## Hydration Directives
- `client:load`: High-priority interactive elements (navbars, search bars).
- `client:visible`: Lower-page widgets hydrated only when scrolled into view.
- `client:media="(max-width: 768px)"`: Mobile-only interactive toggles.
