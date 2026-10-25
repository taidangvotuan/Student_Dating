---
name: supabase-migrations-rls
description: Declarative Supabase migrations, tight Row-Level Security (RLS) policies, and role-based data protection.
---

# Supabase Schema Migrations & Row-Level Security (RLS)

## Overview
Zero-leak database security with Postgres RLS policies and declarative migration workflows via the Supabase CLI.

## RLS Enforcement Golden Rule
Never leave a table with RLS disabled. Even public tables must have an explicit `SELECT` policy.

```sql
-- Always enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Deny all by default, explicitly allow authenticated tenant members
CREATE POLICY "Users can only view projects in their tenant"
ON projects FOR SELECT
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can only insert projects in their tenant"
ON projects FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

## Migration Workflow
1. `supabase migration new create_projects_table`
2. Edit migration file in `supabase/migrations/`
3. `supabase db test` (Verify against test database)
4. `supabase db push` (Apply to production)
