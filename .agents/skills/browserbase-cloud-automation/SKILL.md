---
name: browserbase-cloud-automation
description: Cloud headless browser automation with Browserbase, stealth fingerprints, session replay, CAPTCHA solving, and parallel web tasks.
---

# Cloud Browser Automation with Browserbase

## Overview
Browserbase provides managed, serverless Chromium browsers in the cloud equipped with residential proxies, anti-detect finger-printing, automatic CAPTCHA solving, and full DOM session replays. It enables resilient web extraction, agent automation, and continuous QA without maintaining local browser pools.

## Core Capabilities
- **Anti-Bot Bypass**: Native fingerprint randomization that passes Cloudflare Bot Management and Datadome challenges.
- **Session Debugging**: Live WebRTC inspector and recorded session replay URLs for forensic debugging.
- **Integrations**: Drop-in compatible with Playwright, Puppeteer, and Stagehand.

## Implementation Patterns

### 1. Playwright Integration with Browserbase Cloud Session
```typescript
import { chromium } from 'playwright';
import { Browserbase } from '@browserbaseHQ/sdk';

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

export async function runCloudAutomation(targetUrl: string) {
  // 1. Create a remote managed session
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    proxies: true, // Route via residential proxies
    keepAlive: false,
  });

  console.log(`[Browserbase Session] ID: ${session.id}`);
  console.log(`[Live Debug URL]: ${session.debuggerFullscreenUrl}`);

  // 2. Connect Playwright to the remote browser over CDP
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Extract dynamic data
    const pageTitle = await page.title();
    const metrics = await page.evaluate(() => ({
      readyState: document.readyState,
      linksCount: document.querySelectorAll('a').length,
    }));

    return { sessionUrl: session.debuggerFullscreenUrl, pageTitle, metrics };
  } finally {
    await browser.close();
  }
}
```

### 2. Auto-CAPTCHA Solving & Downloads Handling
```typescript
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserSettings: {
    solveCaptchas: true, // Automatically solve Turnstile, hCaptcha, reCAPTCHA
    blockAds: true,
  },
});
```

## Best Practices & Security Guardrails
- **Keep API Keys in Environment Variables**: Never commit `BROWSERBASE_API_KEY` or project secrets into code.
- **Reuse Context Wisely**: Close browser instances in `finally` blocks to release cloud compute slots immediately.
- **Session Lifespans**: Set appropriate session timeout limits (`timeout: 180`) to avoid runaway cloud billing.\n