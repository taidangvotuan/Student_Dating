---
name: mobile-app-size-reduction
description: Mobile binary size minimization, ProGuard/R8 dead-code stripping, dynamic feature delivery, and image asset optimization.
---

# Mobile Application Size Optimization

## Overview
Minimizes download and install sizes for iOS (.ipa) and Android (.aab) to improve installation conversion rates.

## Optimization Techniques
1. **Android App Bundle (.aab)**: Generates split APKs per device DPI, architecture, and language.
2. **ProGuard / R8 Shrinking**: Strips unused classes and minimizes symbol names (`minifyEnabled true`, `shrinkResources true`).
3. **Asset Vectorization**: Convert PNG icons to SVG / VectorDrawables. Compress photo assets to WebP.
4. **ABI Splitting**: Discard x86/x86_64 binaries in production if not supporting emulator builds.
