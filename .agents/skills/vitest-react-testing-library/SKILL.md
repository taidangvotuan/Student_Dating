---
name: vitest-react-testing-library
description: Fast unit and integration component testing using Vitest, React Testing Library, user-event, and Mock Service Worker (MSW).
---

# Component Testing with Vitest & RTL

## Overview
Tests user behavior rather than implementation details, ensuring UI reliability without brittle snapshot tests.

## Golden Rules
- Query elements by role (`getByRole('button')`) as a real user would.
- Use `@testing-library/user-event` instead of `fireEvent` to simulate realistic browser keystrokes and focus changes.
