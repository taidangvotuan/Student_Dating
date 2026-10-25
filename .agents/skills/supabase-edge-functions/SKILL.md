---
name: supabase-edge-functions
description: Developing, testing, and deploying serverless Deno Edge Functions on Supabase with JWT verification and streaming.
---

# Supabase Edge Functions

## Overview
Fast, low-latency TypeScript functions running on Deno at the edge, integrated directly with Supabase Auth, Storage, and Database.

## Implementation Pattern
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization")!;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  return new Response(JSON.stringify({ message: `Hello ${user.email}` }), {
    headers: { "Content-Type": "application/json" }
  });
});
```
