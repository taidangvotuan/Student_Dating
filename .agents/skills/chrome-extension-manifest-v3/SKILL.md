---
name: chrome-extension-manifest-v3
description: Modern Chrome Extension architecture using Manifest V3, background service workers, content script sandboxing, and storage sync.
---

# Chrome Extension Engineering (Manifest V3)

## Overview
Develops compliant browser extensions adhering to Google Chrome's Manifest V3 security requirements (ephemeral service workers, no remote code execution).

## Core Rules
- **No `eval()` or Remote Scripts**: All code must be packaged locally within the extension zip.
- **Service Worker Lifecycle**: Handle service worker termination gracefully; persist state in `chrome.storage.local`.
