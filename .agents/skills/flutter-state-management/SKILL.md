---
name: flutter-state-management
description: Scalable Flutter state management using BLoC and Riverpod, ensuring clean architecture separation and testability.
---

# Flutter Clean Architecture & State Management

## Overview
Architects Flutter enterprise applications separating presentation, business logic (BLoC / Notifier), and domain data sources.

## Core Rules
- **No Business Logic in Widgets**: UI widgets only render states and dispatch events.
- **Immutable States**: State objects must be value-comparable using `freezed` or `equatable`.
- **Unit-Testable Blocs**: Every state transition must be verifiable with `bloc_test`.
