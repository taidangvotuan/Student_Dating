---
name: resend-react-email
description: Transactional email engineering using Resend and React Email with strict delivery hygiene, SPF/DKIM verification, and webhooks.
---

# Transactional Email Engineering with Resend & React Email

## Overview
Authoring, testing, and delivering production transactional emails using React components and the Resend API. Eliminates brittle legacy HTML email tables while ensuring high inbox deliverability, DKIM/SPF domain verification, and webhook event tracking.

## Core Architecture
- **Component Authoring**: Build emails using `@react-email/components` (Tailwind, Container, Button, Img, Section).
- **Compilation**: Render React components to inline-CSS HTML table markup via `@react-email/render`.
- **Delivery**: Dispatch via `resend` SDK with idempotency keys and error handling.
- **Observability**: Handle inbound delivery webhooks (`email.delivered`, `email.bounced`, `email.complained`).

## Implementation Patterns

### 1. Type-Safe React Email Template
```tsx
// emails/WelcomeEmail.tsx
import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
  verificationUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  verificationUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to AlgoViz - Verify your email address</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans text-slate-800">
          <Container className="mx-auto my-10 max-w-[580px] rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <Heading className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome, {userName}!
            </Heading>
            <Text className="mt-4 text-base leading-6 text-slate-600">
              Thank you for joining our platform. Please verify your email to unlock all features.
            </Text>
            <Section className="my-6 text-center">
              <Button
                href={verificationUrl}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-700"
              >
                Verify Email Address
              </Button>
            </Section>
            <Hr className="my-6 border-slate-200" />
            <Text className="text-xs text-slate-400">
              If you did not create this account, please ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
```

### 2. Resend Delivery Service with Error Handling & Idempotency
```typescript
// lib/email-service.ts
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  email,
  name,
  verificationUrl,
  requestId,
}: {
  email: string;
  name: string;
  verificationUrl: string;
  requestId: string;
}) {
  try {
    const { data, error } = await resend.emails.send(
      {
        from: 'AlgoViz Security <notifications@algoviz.dev>',
        to: [email],
        subject: 'Verify your AlgoViz account',
        react: WelcomeEmail({ userName: name, verificationUrl }),
        headers: {
          'X-Entity-Ref-ID': requestId,
        },
      },
      {
        idempotencyKey: `welcome-${requestId}`,
      }
    );

    if (error) {
      console.error('[Resend Error]', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('[Email Dispatch Exception]', err);
    throw err;
  }
}
```

## Best Practices & Deliverability Guardrails
- **Authenticate DNS**: Set up DKIM, SPF, and DMARC (`v=DMARC1; p=reject;`) records before sending production emails.
- **Prevent Gmail Clipping**: Keep email HTML payload size under 102 KB to avoid Gmail truncation.
- **Always provide plain text fallback**: Enable Resend's automatic text rendering or supply explicit text alternatives.
- **Idempotency Keys**: Use unique request/event IDs in the `idempotencyKey` parameter to prevent double-sends on network retry.\n