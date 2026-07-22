# Makerkit SaaS Starter

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** (Postgres, Auth, Storage)
- **Tailwind CSS 4** + Shadcn UI
- **Turborepo** monorepo

## Monorepo Structure

| Directory           | Purpose                       | Details                           |
| ------------------- | ----------------------------- | --------------------------------- |
| `apps/web`          | Main Next.js app              | See `apps/web/AGENTS.md`          |
| `apps/web/supabase` | Database schemas & migrations | See `apps/web/supabase/AGENTS.md` |
| `apps/e2e`          | Playwright E2E tests          | See `apps/e2e/AGENTS.md`          |
| `packages/ui`       | UI components (@kit/ui)       | See `packages/ui/AGENTS.md`       |
| `packages/supabase` | Supabase clients              | See `packages/supabase/AGENTS.md` |
| `packages/next`     | Next.js utilities             | See `packages/next/AGENTS.md`     |
| `packages/features` | Feature packages              | See `packages/features/AGENTS.md` |

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `apps/web/node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Multi-Tenant Architecture

- **Personal Accounts**: `auth.users.id = accounts.id`
- **Team Accounts**: Shared workspaces with members, roles, permissions
- Data links to accounts via `account_id` foreign key

## Essential Commands

```bash
pnpm dev                          # Start development
pnpm supabase:web:start           # Start local Supabase
pnpm supabase:web:reset           # Reset database
pnpm supabase:web:typegen         # Generate TypeScript types
pnpm typecheck                    # Type check
pnpm lint:fix                     # Fix linting
pnpm format:fix                   # Format code
```

## Key Patterns (Quick Reference)

| Pattern        | Import                                                       | Details                       |
| -------------- | ------------------------------------------------------------ | ----------------------------- |
| Server Actions | `authActionClient` from `@kit/next/safe-action`              | `packages/next/AGENTS.md`     |
| Route Handlers | `enhanceRouteHandler` from `@kit/next/routes`                | `packages/next/AGENTS.md`     |
| Server Client  | `getSupabaseServerClient` from `@kit/supabase/server-client` | `packages/supabase/AGENTS.md` |
| UI Components  | `@kit/ui/{component}`                                        | `packages/ui/AGENTS.md`       |
| Translations   | `Trans` from `@kit/ui/trans`                                 | `packages/ui/AGENTS.md`       |

## Authorization

- **RLS enforces access control** - no manual auth checks needed with standard client
- **Admin client** (`getSupabaseServerAdminClient`) bypasses RLS - use sparingly with manual validation


## TypeScript

- Write clean, simple, explicit code
- Avoid obvious comments; add where clarity needed
- Infer types implicitly - avoid explicit return types
- Never use `any` unless required and justified
- Use service pattern for server-side APIs
- Add `import 'server-only';` to server-only code (except if using 'use server') (not needed in components)
- Never mix client/server imports - use separate package.json exports

## React

- Encapsulate repeated code into reusable local components
- Write small, composable, well-named components
- Always use `react-hook-form` and `@kit/ui/form` for forms
- Always use 'use client' directive for client components
- Add `data-testid` for E2E tests where appropriate
- Avoid `useEffect` - justify if necessary
- Prefer single state object over multiple `useState`
- Prefer RSC for data fetching
- Display `Spinner` (from `@kit/ui/spinner`) where appropriate

## Next.js

- Use `next-safe-action` for Server Actions
- Prefer implicit typing to explicit (unless required)
- Use `authActionClient` (from `@kit/next/safe-action`) to protect actions; compose extra checks via `next-safe-action`'s `.use()` middleware
- Use `use server` in server actions files
- Add page metadata to pages
- Use `redirect` after server actions (avoid client router)

## Verification

After implementation, always run:

1. `pnpm typecheck`
2. `pnpm lint:fix`
3. `pnpm format:fix`
4. Run adversarial reviewer skill /reviewer
5. **If the change touched RLS or the database schema** — any policy, grant, `SECURITY DEFINER` function, view, migration, or file under `apps/web/supabase/` — also run the deep adversarial RLS review skill /rls-review to prove tenant isolation with pgTAP before merging.
6. Use available **Skills** when relevant. If unavailable, continue with local `AGENTS.md`, source, tests, and package exports.