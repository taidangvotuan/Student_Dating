---
name: module-federation-microfrontends
description: Micro-frontend architecture with Webpack/Vite Module Federation, dynamic remote loading, and shared dependency singletons.
---

# Module Federation Micro-Frontends

## Overview
Enables independent cross-functional teams to deploy distinct parts of a frontend application independently without monolith rebundles.

## Shared Dependency Singletons
- Configure React, ReactDOM, and core design systems as singletons (`singleton: true, requiredVersion: auto`) to avoid duplicate runtime libraries.
