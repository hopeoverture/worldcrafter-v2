# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

**Skills** (scaffolding) vs **Agents** (analysis):

- Create table → `worldcrafter-database-setup`
- Build feature → `worldcrafter-feature-builder`
- Add page → `worldcrafter-route-creator`
- Add auth → `worldcrafter-auth-guard`
- Generate tests → `worldcrafter-test-generator`
- Review code → `codebase-review-architect`
- Check RLS → `rls-policy-validator`
- Review migration → `migration-reviewer`
- Analyze performance → `query-performance-analyzer`

See `.claude/CLAUDE-SKILLS.md` and `.claude/CLAUDE-AGENTS.md` for details.

---

## Essential Commands

### Development

- `npm run dev` - Dev server (localhost:3000)
- `npm run build` - **CRITICAL: Run before pushing** (catches TypeScript errors)
- `npm test` - Vitest unit tests (watch mode)
- `npm run test:e2e` - Playwright E2E tests
- `npm run lint` - ESLint
- `npm run format` - Prettier

### Database Workflow (IMPORTANT)

**After ANY schema change, run BOTH:**

```bash
# 1. Production database
npx prisma migrate dev --name description
npm run db:rls  # Apply RLS policies

# 2. Test database (CRITICAL)
npm run db:test:sync  # Sync Prisma schema
npx dotenv-cli -e .env.test -- node scripts/apply-rls-migration.mjs  # Apply RLS

# 3. Verify
npm test
```

**Other database commands:**

- `npm run db:studio` - Prisma Studio GUI (localhost:5555)
- `npx prisma generate` - Regenerate client after schema changes

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: Supabase (PostgreSQL) via Prisma ORM
- **Auth**: Supabase Auth (SSR cookie-based sessions)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Notifications**: Sonner toast notifications
- **Rich Text**: @uiw/react-md-editor (markdown)
- **Testing**: Vitest (unit/integration) + Playwright (E2E)

**Path Alias**: `@/` → `./src/*` (keep synced: tsconfig.json, vitest.config.ts, components.json)

---

## Critical Architecture Patterns

### Authentication Flow (MUST UNDERSTAND)

1. Sessions in HTTP-only cookies (NOT localStorage)
2. `src/middleware.ts` runs on EVERY request to refresh session
3. Database trigger auto-creates `users` record on signup
4. `User` model (public.users) references auth.users(id)

**Supabase clients:**

- Client components: `createClient()` from `@/lib/supabase/client`
- Server components/actions: `await createClient()` from `@/lib/supabase/server` (**async**)
- Both respect RLS policies automatically

**Protected routes** (in Server Components):

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
if (resource.userId !== user.id) notFound(); // Ownership check
```

### Data Access Patterns

**Server Components** (preferred): Fetch data directly with Prisma/Supabase, no API route needed
**Client Components**: Use TanStack Query + Server Actions (preferred) or API routes
**NEVER**: Call API routes from server components - import server code directly

### Database Critical Details

**Two connection strings** (Supabase PgBouncer):

- `DATABASE_URL` (port 6543): Transaction pooler - **USE FOR ALL QUERIES**
- `DIRECT_DATABASE_URL` (port 5432): **USE ONLY FOR MIGRATIONS**

**Row-Level Security (RLS)**:

- **YOU MUST enable RLS on ALL tables with user data**
- Apply with `npm run db:rls` after creating tables
- See `docs/RLS_SETUP.md` for patterns

**Schema Design**:

- Tables: snake_case (via `@@map`), Prisma models: PascalCase
- Enums: Duplicate between Prisma and Zod (keep manually synced)
- Schema: `prisma/schema.prisma`

### Next.js 16 Breaking Change

**Route params are now async:**

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // MUST await!
}
```

---

## WorldCrafter Patterns

### Server Action Standard

**ALL Server Actions return this:**

```typescript
type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

### Server Action Pattern

```typescript
"use server";
export async function createWorld(values: CreateWorldInput) {
  const validated = createWorldSchema.parse(values); // 1. VALIDATE
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // 2. AUTH
  if (!user) return { success: false, error: "Unauthorized" };

  const slug = generateSlug(validated.name); // 3. SLUG
  const world = await prisma.world.create({
    data: { ...validated, slug, userId: user.id },
  }); // 4. DB

  await prisma.activity.create({
    // 5. ACTIVITY LOG
    data: {
      userId: user.id,
      entityType: "world",
      entityId: world.id,
      action: "created",
      metadata: { name: world.name },
    },
  });

  revalidatePath("/worlds"); // 6. REVALIDATE
  return { success: true, data: world };
}
```

### Key Patterns

**Slug Generation**: Auto-generated in Server Actions (never in forms), format: `{name-kebab}-{random-6}`
**Activity Logging**: ALL CRUD operations must log to `activities` table
**Toast Notifications**: `import { toast } from "sonner"` → `toast.success()` / `toast.error()`
**Markdown Editor**: MUST use `dynamic(() => import("@uiw/react-md-editor"), { ssr: false })`
**Dual Schemas**: API schema (with defaults) vs Form schema (no defaults, force selection)

### Form Handling

1. Define Zod schema in `src/lib/schemas/`
2. Use React Hook Form with `zodResolver(schema)` in component
3. Submit to Server Action
4. **ALWAYS validate again on server** with same Zod schema

### Route Structure

- `page.tsx` - Route content
- `loading.tsx` - Suspense boundary for async Server Components
- `error.tsx` - Error boundary (must be client component)
- `not-found.tsx` - 404 handler

---

## Testing Strategy

**Three-layer pyramid** (see `docs/TESTING_CHECKLIST.md`):

1. **Unit Tests (60-70%)** - `src/**/__tests__/*.test.ts`
   - React Testing Library, mocked Supabase/Prisma
   - Use `renderWithProviders()`, factories in `src/test/factories/`
   - **CRITICAL**: Call `reset{Entity}Factory()` in `beforeEach`

2. **Integration Tests (20-30%)** - `src/app/__tests__/*.integration.test.ts`
   - Uses `.env.test` with separate test database
   - Test Server Actions, RLS policies, complex flows
   - Clean up test data in `afterAll` hooks

3. **E2E Tests (10-20%)** - `e2e/*.spec.ts`
   - Playwright, Page Object Models in `e2e/pages/`
   - Critical user flows (auth, forms, navigation)

**Coverage**: 80% minimum (enforced)

**Vitest config**: `fileParallelism: false` (prevents race conditions in integration tests)

---

## Critical Pitfalls (AVOID)

1. **Supabase clients**: Don't mix client/server imports. Server version is async!
2. **Connection strings**: Port 6543 for queries, 5432 ONLY for migrations
3. **RLS**: Enable on ALL user data tables or anyone can read/write everything
4. **Test DB sync**: After schema changes, MUST sync BOTH Prisma schema AND RLS migrations
5. **Next.js 16 params**: Always `await params` in pages (async now)
6. **Markdown editor**: Use `dynamic()` with `ssr: false` or hydration errors
7. **Test factories**: Reset in `beforeEach` or data pollution
8. **Slugs**: Never manual in forms - server-side only via `generateSlug()`
9. **Activity logs**: Log ALL CRUD operations or feed incomplete
10. **Server Actions**: Always return `ActionResponse<T>` type
11. **Enum sync**: Manually sync Prisma and Zod enums
12. **Type safety**: Run `npm run build` before pushing
13. **API routes**: Don't call from server components - import directly
14. **Server Actions**: Always validate on server even if validated on client
15. **Git hooks**: Pre-commit runs lint/tests/format - fix before they block

---

## Environment Variables

**Required:**

```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
DATABASE_URL="postgresql://...6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://...5432/postgres"
```

**Rules:**

- Server-only: Import from `@/lib/env` (**NEVER in client components**)
- Client vars: **MUST have `NEXT_PUBLIC_` prefix**
- Tests: Use `.env.test` with separate test database

---

## Git Hooks (Husky)

Pre-commit runs automatically:

- `eslint --fix` on staged files
- `vitest related --run` (tests for CHANGED files only)
- `prettier --write` on staged files

Skip: `git commit --no-verify` (use sparingly)

---

## ESLint Config

- Modern `eslint.config.mjs` (ESLint 9+ flat config)
- **NO `.eslintignore`** - use `globalIgnores([...])` in config
- Ignored: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`, `.claude/**`

---

## Key Documentation

- `README.md` - Setup instructions
- `docs/RLS_SETUP.md` - Row-Level Security patterns
- `docs/TESTING_CHECKLIST.md` - Complete testing guide
- `docs/TEST_DATABASE_SETUP.md` - Test database setup
- `.claude/CLAUDE-SKILLS.md` - Detailed skill descriptions
- `.claude/CLAUDE-AGENTS.md` - Detailed agent descriptions

---

## When You Repeat Yourself

If you find yourself giving the same instructions across multiple sessions, add them to this file.
