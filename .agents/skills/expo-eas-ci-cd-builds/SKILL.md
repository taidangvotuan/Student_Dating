---
name: expo-eas-ci-cd-builds
description: Automated cloud compilation and deployment using Expo Application Services (EAS Build and EAS Submit) for iOS and Android.
---

# Expo EAS Cloud Build & Release Pipelines

## Overview
Automates native binary compilation (.ipa, .aab) in the cloud without requiring a dedicated macOS machine, streamlining Google Play and Apple App Store deployments.

## Configuration (eas.json)
```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## CI Build Trigger
```bash
eas build --platform all --profile production --non-interactive --auto-submit
```
