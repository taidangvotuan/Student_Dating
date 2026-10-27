---
name: typescript-advanced-type-gymnastics
description: Advanced TypeScript type-level programming, branded types, generic inference (infer), template literal types, satisfies, and AST codemods.
---

# Advanced TypeScript Type Gymnastics (Matt Pocock Patterns)

## Overview
Master type-level engineering in TypeScript to build bulletproof APIs, domain-driven branded nominal types, and zero-runtime type assertions.

## 1. Branded Nominal Types
Prevent accidental primitive mix-ups (e.g. passing `UserId` into a `TenantId` parameter):

```typescript
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

export type UserId = Brand<string, 'UserId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;

function getOrganization(orgId: OrganizationId) { /* ... */ }

const userId = "usr_123" as UserId;
const orgId = "org_456" as OrganizationId;

// getOrganization(userId); // ❌ Compile error!
getOrganization(orgId);    // ✅ Valid!
```

## 2. Dynamic Template Literal Validation
```typescript
type Protocol = 'http' | 'https';
type Port = `:${number}`;
type URLString = `${Protocol}://${string}${Port | ''}/${string}`;

const validUrl: URLString = "https://api.example.com:8080/v1";
```

## 3. Deep Generic Inference with `infer`
```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

## 4. The `satisfies` Operator
Validates that a type conforms to a shape without widening or losing specific literal inferences:
```typescript
type Palette = Record<string, string | number[]>;

const theme = {
  primary: "#3b82f6",
  accent: [59, 130, 246],
} satisfies Palette;

// Inferred as string, not string | number[]:
theme.primary.toUpperCase();
```
