---
name: view-transitions-api
description: Smooth page and element transitions using the native browser View Transitions API, cross-fade, and shared layouts.
---

# Native View Transitions API

## Overview
Creates native-app-like page transitions in modern browsers without massive third-party animation libraries.

## Implementation Pattern
```javascript
function navigateToPage(url) {
  if (!document.startViewTransition) {
    window.location.href = url;
    return;
  }
  document.startViewTransition(async () => {
    await updateDOMContent(url);
  });
}
```
