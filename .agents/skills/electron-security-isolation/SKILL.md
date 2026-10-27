---
name: electron-security-isolation
description: Enterprise Electron application security, context isolation, IPC validation, and content security policies (CSP).
---

# Electron Security & Context Isolation

## Overview
Hardens Electron desktop apps against Remote Code Execution (RCE) and local filesystem compromise.

## Non-Negotiable Security Settings
```javascript
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,        // Banned: Never allow Node in renderer
    contextIsolation: true,       // Mandatory: Separate contexts
    sandbox: true,                // Mandatory: Sandboxed renderer process
    preload: path.join(__dirname, 'preload.js')
  }
});
```
