---
name: mobile-offline-first-sync
description: Offline-first mobile data architecture using local SQLite/WatermelonDB with background synchronization and conflict resolution.
---

# Mobile Offline-First Architecture & Sync

## Overview
Guarantees uninterrupted mobile user experience in zero-connectivity or airplane mode by reading and writing to an encrypted local database first.

## Synchronization Protocol
1. **Local Mutation**: Write changes immediately to SQLite with a `sync_status = 'pending'` flag.
2. **Network Listener**: Detect connectivity restoration via `@react-native-community/netinfo`.
3. **Batch Sync**: Push pending mutations to the backend API with client timestamps.
4. **Conflict Resolution**: Apply Server-Wins or Last-Write-Wins (LWW) with client rollback notification if conflicts occur.
