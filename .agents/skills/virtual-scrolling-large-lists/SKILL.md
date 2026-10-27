---
name: virtual-scrolling-large-lists
description: Virtualized DOM rendering for massive datasets (100k+ rows) using TanStack Virtual and react-window.
---

# Virtual Scrolling & Large Dataset Rendering

## Overview
Eliminates DOM bloat and scroll lag by only rendering DOM nodes currently visible in the user's viewport.

## TanStack Virtual Pattern
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList({ items }) {
  const parentRef = React.useRef();
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index} style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)` }}>
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```
