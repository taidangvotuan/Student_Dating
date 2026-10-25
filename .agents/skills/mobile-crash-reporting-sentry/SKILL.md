---
name: mobile-crash-reporting-sentry
description: Mobile crash triage, symbolication (dSYM, ProGuard mappings), native breadcrumbs, and performance monitoring with Sentry.
---

# Mobile Crash Reporting & Sentry Triage

## Overview
Detects, symbolicates, and triages native crashes (C/C++, Java/Kotlin, Objective-C/Swift) and JavaScript exceptions across production mobile fleets.

## Setup & Symbolication
- Automated CI upload of dSYM files (iOS) and ProGuard mapping files (Android) on every EAS build.
- Capture user navigation breadcrumbs and network request telemetry leading up to the fatal crash.
