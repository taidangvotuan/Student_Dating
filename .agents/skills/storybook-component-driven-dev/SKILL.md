---
name: storybook-component-driven-dev
description: Component-Driven Development (CDD) with Storybook 8, interaction testing with @storybook/test, and visual regression.
---

# Component-Driven Development with Storybook

## Overview
Builds UI components in complete isolation from backend APIs and business logic, documenting variants, states, and accessibility contracts.

## Story Interaction Test Pattern
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = { component: LoginForm };
export default meta;

export const InvalidSubmission: StoryObj<typeof LoginForm> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
  },
};
```
