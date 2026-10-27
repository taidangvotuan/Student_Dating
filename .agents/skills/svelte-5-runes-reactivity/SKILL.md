---
name: svelte-5-runes-reactivity
description: Universal reactivity in Svelte 5 using Runes ($state, $derived, $effect), snippet composition, and component architecture.
---

# Svelte 5 Runes & Modern Reactivity

## Overview
Delivers surgical, fine-grained reactivity in Svelte 5 without compiler quirks or dependency arrays.

## Core Runes
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log(`Count changed to: ${count}`);
  });
</script>

<button onclick={() => count++}>
  Count: {count} (Doubled: {doubled})
</button>
```
