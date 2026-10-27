---
name: radix-ui-headless-primitives
description: Accessible, unstyled UI primitives using Radix UI and shadcn/ui, slot composition (asChild), and focus trapping.
---

# Radix UI Headless Primitives & Accessibility

## Overview
Constructs design-system components on top of WAI-ARIA compliant unstyled primitives with zero accessibility compromises.

## The Slot Pattern (asChild)
```tsx
import * as Dialog from '@radix-ui/react-dialog';

export function CustomDialogTrigger() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="btn-primary">Open Settings</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>Account Settings</Dialog.Title>
          <Dialog.Close asChild>
            <button className="btn-close">Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```
