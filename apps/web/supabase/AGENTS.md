# Supabase Database

## Schema Organization

Schemas in `schemas/` directory with numbered prefixes for dependency ordering.

## Skills

For database implementation:
- `/postgres-expert` - Schema design, RLS, migrations, testing

After any change to RLS, grants, `SECURITY DEFINER` functions, views, or schema in
this directory, run the deep adversarial RLS review during verification:
- `/rls-review` - Statically audits tenant-isolation holes, then proves them (or
  their absence) with runnable pgTAP cross-tenant attack tests.

## Migration Workflow

### New Entities

```bash
# Create schema file
touch schemas/20-feature.sql

# Create migration
pnpm --filter web run supabase migrations new feature_name

# Copy content, apply, generate types
pnpm --filter web supabase migrations up
pnpm supabase:web:typegen
```

### Modify Existing

```bash
# Edit schema, generate diff
pnpm --filter web run supabase:db:diff -f update_feature

# Apply and regenerate
pnpm --filter web supabase migrations up
pnpm supabase:web:typegen
```

## Security Rules

- **ALWAYS enable RLS** on new tables
- **NEVER use SECURITY DEFINER** without explicit access controls
- Use existing helper functions (see `/postgres-expert` skill)
- **NEVER grant table-level `UPDATE` to `authenticated`.** Grant column-level
  UPDATE listing only the user-editable columns. Identity/tenancy columns
  (`id`, `account_id`, and any FK that defines ownership) must be excluded so a
  user cannot re-parent a row into another account via
  `UPDATE ... SET account_id = <other tenant>`. RLS `WITH CHECK` alone does not
  cover this cleanly; column privileges reject it up front.
  - Column privileges are checked only against the statement's `SET` list, so
    `BEFORE` triggers that write `updated_at`/tracking/system columns keep
    working even though `authenticated` lacks UPDATE on them.
  - `service_role` keeps full-table UPDATE for system-managed columns.
  - `migra` (`supabase:db:diff`) does NOT emit column grants — it only detects
    the `REVOKE`. Hand-write the `grant update (cols)` lines into the migration.

## Table Template

```sql
create table if not exists public.feature (
  id uuid unique not null default extensions.uuid_generate_v4(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (id)
);

alter table "public"."feature" enable row level security;
revoke all on public.feature from authenticated, service_role;

-- service_role keeps full-table access
grant select, insert, update, delete on table public.feature to service_role;

-- authenticated: full access EXCEPT UPDATE, which is column-scoped so id and
-- account_id (the tenancy link) can never be changed by a user's own UPDATE
grant select, insert, delete on table public.feature to authenticated;
grant update (/* user-editable columns only, NOT id / account_id */)
  on table public.feature to authenticated;

-- Use helper functions for policies
create policy "feature_read" on public.feature for select
  to authenticated using (
    account_id = (select auth.uid()) or
    public.has_role_on_account(account_id)
  );
```

## Commands

```bash
pnpm supabase:web:reset     # Reset database
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase migrations list  # View migrations
```
