---
name: inp-responsiveness-profiling
description: Interaction to Next Paint (INP) debugging, long tasks breakdown, scheduler.yield(), and Chrome DevTools Performance panel.
---

# INP & Web Vitals Responsiveness Profiling

## Overview
Diagnoses input delays and visual response lag to keep the Core Web Vital INP metric under 200ms.

## Yielding Long Tasks with scheduler.yield()
```javascript
async function processLargeDataset(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);
    // Yield execution to main thread periodically so user clicks are handled
    if (i % 100 === 0 && 'scheduler' in window && 'yield' in window.scheduler) {
      await window.scheduler.yield();
    }
  }
}
```
