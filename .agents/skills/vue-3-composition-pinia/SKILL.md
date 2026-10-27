---
name: vue-3-composition-pinia
description: Modern Vue 3 engineering with <script setup>, custom composables, Pinia state stores, and TypeScript integration.
---

# Vue 3 Composition API & Pinia

## Overview
Architects scalable Vue 3 enterprise applications using clean `<script setup>` syntax, modular composables, and type-safe Pinia stores.

## Pinia Store Pattern
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + item.price, 0));

  function addItem(item: CartItem) {
    items.value.push(item);
  }

  return { items, totalPrice, addItem };
});
```
