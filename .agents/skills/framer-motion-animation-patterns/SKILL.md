---
name: framer-motion-animation-patterns
description: Declarative UI animations in React using Framer Motion, layout animations, exit transitions, and spring physics.
---

# Framer Motion Animation Architecture

## Overview
Creates natural, agency-quality animations in React with physics-based springs and smooth layout transitions.

## Shared Layout Animation Pattern
```tsx
import { motion, AnimatePresence } from 'framer-motion';

export function TabNav({ activeTab, tabs }) {
  return (
    <nav className="flex space-x-2">
      {tabs.map(tab => (
        <button key={tab.id} className="relative px-4 py-2">
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-blue-500 rounded-lg -z-10"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
```
