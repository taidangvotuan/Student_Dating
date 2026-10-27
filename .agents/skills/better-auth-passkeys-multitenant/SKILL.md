---
name: better-auth-passkeys-multitenant
description: Modern authentication and authorization with Better-Auth, WebAuthn/Passkeys, two-factor auth (TOTP), organization multi-tenancy, and session management.
---

# Better-Auth Architecture, Passkeys & Multi-Tenancy

## Overview
Implements enterprise authentication using Better-Auth, eliminating legacy NextAuth/Auth.js footguns with built-in WebAuthn Passkeys, two-factor authentication, and organization multi-tenancy.

## Core Rules & Principles
1. **Passkeys First**: Offer biometric WebAuthn passkeys as primary frictionless auth.
2. **Database Agnostic**: Use Drizzle or Prisma adapters with explicit schema migrations.
3. **Multi-Tenant Scoping**: Isolate organization members, roles, and teams at the database query level.
4. **Secure Cookie Lifecycles**: Enforce `HttpOnly`, `SameSite=Lax`, and short-lived access tokens with automatic rotation.

## Better-Auth Configuration (auth.ts)
```typescript
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins/passkey";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [
    passkey(),
    organization({
      allowUserToCreateOrganization: true,
      roles: ["owner", "admin", "member"],
    }),
    twoFactor({
      issuer: "CorpApp",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // Refresh daily
  },
});
```

## Client Authentication Hook (React/Next.js)
```tsx
import { authClient } from "@/lib/auth-client";

export function PasskeySignIn() {
  const handlePasskey = async () => {
    await authClient.signIn.passkey({
      fetchOptions: {
        onSuccess: () => window.location.href = "/dashboard",
      },
    });
  };

  return (
    <button onClick={handlePasskey} className="btn-passkey">
      Sign in with FaceID / TouchID
    </button>
  );
}
```
