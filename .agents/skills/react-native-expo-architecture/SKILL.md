---
name: react-native-expo-architecture
description: Modern React Native and Expo Router v3 architecture, typed routing, atomic component design, and state management.
---

# React Native & Expo Router Architecture

## Overview
Scalable cross-platform mobile architecture leveraging Expo SDK and Expo Router (file-based navigation) with strict TypeScript type safety.

## Recommended Directory Structure
```
app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── profile.tsx
├── +not-found.tsx
└── _layout.tsx
components/
├── ui/
└── features/
hooks/
services/
```

## Typed Navigation Pattern
```typescript
import { useRouter } from 'expo-router';

export function NavigationButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: '42' } })}>
      <Text>View User</Text>
    </Pressable>
  );
}
```
