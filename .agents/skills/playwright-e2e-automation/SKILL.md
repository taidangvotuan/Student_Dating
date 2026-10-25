---
name: playwright-e2e-automation
description: Resilient end-to-end testing with Playwright, multi-browser execution, trace analysis, and anti-flakiness design.
---

# Playwright E2E Test Automation

## Overview
Executes reliable cross-browser browser tests (Chromium, Firefox, WebKit) with auto-waiting, network mocking, and rich video/trace debugging.

## Golden Rules for Zero-Flakiness
1. **Never use static sleeps (`sleep(3000)`)**: Always wait for specific states (`waitForSelector`, `toBeVisible`).
2. **Use Accessible Selectors**: Prefer `getByRole`, `getByText`, and `getByTestId` over brittle CSS/XPath chains.
3. **Isolate Test State**: Each test must seed its own clean database tenant or account.

## Test Pattern Example
```typescript
import { test, expect } from '@playwright/test';

test('user can complete onboarding flow', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Work Email').fill('engineer@corp.com');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'Welcome aboard' })).toBeVisible({ timeout: 5000 });
});
```
