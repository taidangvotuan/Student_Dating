---
name: angular-signals-modern
description: Modern Angular 18/19 architecture with Standalone components, reactive Signals, resource API, and Zoneless change detection.
---

# Modern Angular: Standalone Components & Reactive Signals

## Overview
Modern Angular (v18+) abandons legacy `NgModules` and Zone.js monkey-patching in favor of Standalone Components, fine-grained reactive Signals (`signal`, `computed`, `effect`), and native Zoneless change detection for high-performance enterprise applications.

## Core Reactive Primitives
- `signal<T>(initialValue)`: Writable reactive state holder.
- `computed(() => fn)`: Memoized derived state; recomputes only when read and dependencies change.
- `effect(() => fn)`: Side-effect runner executed during microtask flushing.
- `input<T>()` / `output<T>()`: Signal-based component inputs and event outputs replacing legacy `@Input()` / `@Output()`.
- `model<T>()`: Two-way binding signal primitive.

## Implementation Patterns

### 1. Modern Standalone Component with Signals
```typescript
// src/app/features/sorting-visualizer/visualizer.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sorting-visualizer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="visualizer-container">
      <header class="header">
        <h2>{{ title() }}</h2>
        <span class="badge">Comparisons: {{ comparisons() }}</span>
        <span class="badge">Swaps: {{ swaps() }}</span>
      </header>

      <div class="bars-wrapper">
        @for (item of items(); track item.id) {
          <div
            class="bar"
            [class.active]="item.isActive"
            [style.height.px]="item.value * 3"
          ></div>
        }
      </div>

      <div class="controls">
        <button [disabled]="isRunning()" (click)="startSort()">
          {{ isRunning() ? 'Sorting...' : 'Start Sorting' }}
        </button>
        <button (click)="resetArray()">Reset</button>
      </div>
    </div>
  `,
  styleUrl: './visualizer.component.css',
})
export class VisualizerComponent {
  title = signal<string>('QuickSort Engine');
  items = signal<{ id: number; value: number; isActive: boolean }[]>([]);
  comparisons = signal<number>(0);
  swaps = signal<number>(0);
  isRunning = signal<boolean>(false);

  // Derived state
  totalOperations = computed(() => this.comparisons() + this.swaps());

  constructor() {
    this.resetArray();

    // Debugging side effect
    effect(() => {
      console.log(`[Visualizer State] Operations count: ${this.totalOperations()}`);
    });
  }

  resetArray(): void {
    const fresh = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      value: Math.floor(Math.random() * 80) + 10,
      isActive: false,
    }));
    this.items.set(fresh);
    this.comparisons.set(0);
    this.swaps.set(0);
  }

  async startSort(): Promise<void> {
    this.isRunning.set(true);
    // Algorithm logic updating signals with surgical precision
    this.isRunning.set(false);
  }
}
```

### 2. Signal-Based Form & Input Primitives
```typescript
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-bar-node',
  standalone: true,
  template: `
    <div
      class="node"
      [style.height.px]="height()"
      (click)="selected.emit(nodeId())"
    ></div>
  `,
})
export class BarNodeComponent {
  height = input.required<number>();
  nodeId = input<number>(0);
  selected = output<number>();
}
```

## Best Practices & Modern Guidelines
- **Always use `ChangeDetectionStrategy.OnPush`**: Combined with signals, OnPush triggers surgical DOM updates without scanning whole component trees.
- **Prefer `computed()` over manual subscription**: Never manually subscribe to RxJS observables just to set signal values; use `toSignal()` from `@angular/core/rxjs-interop`.
- **Eliminate NgModules**: Set `standalone: true` on all components, pipes, and directives.\n