---
name: visual-regression-testing
description: Visual regression testing using Pixelmatch and Percy to catch unintended UI visual discrepancies, layout shifts, and CSS breaks.
---

# Visual Regression Testing

## Overview
Compares screenshot diffs pixel-by-pixel between pull requests and production baselines to prevent silent visual regressions.

## Stabilization Techniques
- **Freeze Animations**: Disable CSS transitions and JS animations before capturing (`* { animation: none !important; transition: none !important; }`).
- **Mock Timestamps & Random Data**: Replace live clocks and random avatars with static deterministic assets.
- **Font Preloading**: Wait for `document.fonts.ready` before snapping images.
