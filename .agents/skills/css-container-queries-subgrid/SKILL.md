---
name: css-container-queries-subgrid
description: Component-driven responsive design using CSS Container Queries (@container) and nested alignment with CSS Subgrid.
---

# CSS Container Queries & Subgrid

## Overview
Builds responsive components that adapt to their immediate parent container width rather than the screen viewport, pairing with Subgrid for row alignment.

## Reference Guide
- `references/frontend/modern-css-cheat-sheet.md`

## Code Pattern
```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card-body {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```
