---
name: api-mocking-msw-wiremock
description: Deterministic API mocking using Mock Service Worker (MSW) and WireMock for isolated, reliable test suites.
---

# API Mocking with MSW & WireMock

## Overview
Decouples automated tests from volatile third-party APIs (Stripe, Twilio, OpenAI) using network-level interceptors that return deterministic responses.

## MSW Handler Pattern (TypeScript)
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.payment.com/v1/charges', () => {
    return HttpResponse.json([
      { id: 'ch_123', amount: 5000, status: 'succeeded' }
    ]);
  }),
  http.post('https://api.payment.com/v1/charges', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'ch_456', status: 'created' }, { status: 201 });
  })
];
```
