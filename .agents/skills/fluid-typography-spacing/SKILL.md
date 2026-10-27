---
name: fluid-typography-spacing
description: Mathematical typography scaling with CSS clamp(), modular type scales, and dynamic viewport units (dvh, svh).
---

# Fluid Typography & Spacing Systems

## Overview
Scales typography smoothly across device widths without disjointed media query jumps using mathematical linear interpolation in `clamp()`.

## Reference Guide
- `references/frontend/modern-css-cheat-sheet.md`
- `references/frontend/design-tokens-and-color-palettes.md`

## Spacing Formula
```css
--fluid-space: clamp(1rem, 2.5vw + 0.5rem, 3rem);
```
