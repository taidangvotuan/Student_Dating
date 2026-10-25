---
name: saas-tool-calling-integrations
description: Production SaaS tool integration patterns for AI agents (Linear, GitHub, Jira, Slack, Notion) with webhook HMAC verification and rate limits.
---

# SaaS Tool Calling Integrations (Composio Patterns)

## Overview
Enables autonomous coding agents to interact securely with real-world enterprise SaaS APIs (Linear issues, GitHub PRs, Slack notifications, Notion documents).

## Core Architecture
1. **Tool Schema Registry**: Expose typed, scoped functions (e.g. `linear_create_issue`, `github_create_pull_request`).
2. **Webhook HMAC Signature Verification**: Verify inbound SaaS webhooks with SHA-256 HMAC before triggering agent actions.
3. **Idempotency Keys**: Pass UUID idempotency keys on every state-mutating tool call to prevent duplicate tickets or comments.

## Linear Tool Execution Pattern (TypeScript)
```typescript
import { LinearClient } from "@linear/sdk";

export async function executeLinearTool(action: string, params: Record<string, any>) {
  const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

  switch (action) {
    case "create_issue": {
      const issue = await linear.createIssue({
        teamId: params.teamId,
        title: params.title,
        description: params.description,
        priority: params.priority ?? 1,
      });
      return { success: true, issueId: (await issue.issue)?.id };
    }
    default:
      throw new Error(`Unsupported Linear tool action: ${action}`);
  }
}
```
