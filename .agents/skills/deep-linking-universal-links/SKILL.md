---
name: deep-linking-universal-links
description: Universal Links (iOS) and App Links (Android) deep linking architecture, domain verification, and deferred deep linking.
---

# Deep Linking & Universal Links

## Overview
Directs users seamlessly from web links, emails, and QR codes straight into specific screens inside the native mobile app.

## Verification Files Setup
- **iOS (`apple-app-site-association`)**: Hosted at `https://example.com/.well-known/apple-app-site-association`.
- **Android (`assetlinks.json`)**: Hosted at `https://example.com/.well-known/assetlinks.json` containing the SHA-256 fingerprint of the signing certificate.

## Safe Routing Handler
```typescript
import * as Linking from 'expo-linking';

Linking.addEventListener('url', (event) => {
  const data = Linking.parse(event.url);
  // Route safely to target screen based on data.path and data.queryParams
});
```
