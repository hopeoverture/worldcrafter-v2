# CLAUDE.md

Project-specific guidance for Claude Code. Keep concise and focused on WorldCrafter-specific patterns.

## Essential Commands

### Development

- `npm run dev` - Start Next.js dev server (localhost:3000)
- `npm run build` - **IMPORTANT: Run before pushing** to catch TypeScript errors
- `npm start` - Production server

### Database

- `npx prisma db push` - Quick dev: push schema changes to Supabase
- `npm run db:migrate` - Production: create and apply migration
- `npm run db:rls` - **CRITICAL: Apply after adding new tables with user data**
- `npm run db:studio` - GUI at localhost:5555
- `npx prisma generate` - Regenerate client after schema changes

### Testing

- `npm test` - Vitest unit tests (watch mode)
- `npm run test:coverage` - Coverage report (80% threshold enforced)
- `npm run test:e2e` - Playwright E2E (Chromium, Firefox, Mobile)
- `npm run test:all` - All tests with coverage
- `npm run db:test:sync` - Sync schema to test database (recommended workflow)
- See `docs/TESTING_CHECKLIST.md` for comprehensive testing guide

### Code Quality

- `npm run lint` - ESLint
- `npm run format` - Prettier

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Database**: Supabase (PostgreSQL) via Prisma ORM
- **Auth**: Supabase Auth with SSR cookie-based sessions (HTTP-only cookies, NOT localStorage)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query for client-side data fetching
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Package Manager**: npm (not pnpm/yarn)

## Critical Architecture Patterns

### Authentication Flow

**YOU MUST understand this flow**:

1. Sessions stored in HTTP-only cookies (secure, SSR-friendly)
2. `src/middleware.ts` runs on EVERY request to refresh session via `updateSession()`
3. Database trigger auto-creates `users` table record on signup
4. `User` model in Prisma (public.users) references auth.users(id)

**Supabase Client Usage**:

- Client components: `createClient()` from `@/lib/supabase/client`
- Server components/actions: `createClient()` from `@/lib/supabase/server` (**async**)
- Both respect RLS policies automatically

### Data Access Patterns

**Server Components (Preferred)**:

- Fetch data directly in async server components
- Use Prisma (`prisma.user.findMany()`) or Supabase client
- No API route needed - direct database access
- Better security and performance

**Client Components**:

- Use TanStack Query (`useQuery`, `useMutation`)
- Call Server Actions (preferred) or API routes
- Can use Supabase client directly for real-time features

**IMPORTANT**: Never call API routes from server components - import server code directly instead.

### Database Critical Details

**Two Connection Strings** (Supabase uses PgBouncer):

- `DATABASE_URL` (port 6543): Transaction pooler - **USE FOR ALL QUERIES**
- `DIRECT_DATABASE_URL` (port 5432): Direct connection - **USE ONLY FOR MIGRATIONS**

**Row-Level Security (RLS)**:

- **YOU MUST enable RLS on ALL tables with user data**
- RLS policies enforce `auth.uid()` checks at database level
- Apply with `npm run db:rls` after creating tables
- See `docs/RLS_SETUP.md` for patterns

**Schema Design**:

- Tables: snake_case (via `@@map`)
- Prisma models: PascalCase
- Schema: `prisma/schema.prisma`

### Environment Variables

**Required**:

```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
DATABASE_URL="postgresql://...6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://...5432/postgres"
```

**Rules**:

- Server-only vars: Import from `@/lib/env` (**NEVER in client components**)
- Client vars: **MUST have `NEXT_PUBLIC_` prefix**
- Never commit `.env` to git
- Tests: Use `.env.test` with separate test database

## WorldCrafter-Specific Patterns

### Form Handling Workflow

**Standard pattern** (see `src/app/example-form/` for complete example):

1. Define Zod schema in `src/lib/schemas/`
2. Infer TypeScript type: `type FormData = z.infer<typeof schema>`
3. Use React Hook Form with `zodResolver(schema)` in component
4. Submit to Server Action (preferred) or API route
5. **ALWAYS validate again on server** with same Zod schema

### Server Actions Pattern

**When to use**: Mutations, database access with auth, form handlers

**Standard structure** (see `src/app/example-form/actions.ts`):

```typescript
"use server";
export async function yourAction(values: YourType) {
  const validated = schema.parse(values); // 1. VALIDATE
  const supabase = await createClient(); // 2. AUTH CHECK
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const result = await prisma.yourModel.create({ data: validated }); // 3. DB OPERATION
  revalidatePath("/your-route"); // 4. REVALIDATE
  return { success: true, data: result }; // 5. RETURN TYPED RESPONSE
}
```

**API Routes**: Use only for external APIs, webhooks, custom HTTP methods

### Adding Database Tables

**IMPORTANT - Follow this sequence**:

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_table_name` (or `db push` for dev)
3. **CRITICAL**: Create RLS policies (see `docs/RLS_SETUP.md`)
4. Apply RLS: `npm run db:rls`
5. Regenerate client: `npx prisma generate` (auto-runs after migrate)

### Testing Strategy

**Three-layer pyramid** (see `docs/TESTING_CHECKLIST.md` for details):

1. **Unit Tests (60-70%)** - Vitest + React Testing Library
   - Location: `src/**/__tests__/*.test.ts`
   - Use `renderWithProviders()` from `@/test/utils/render`
   - Mocked Supabase/Prisma (see `src/test/mocks/`)
   - Data factories in `src/test/factories/`
   - **Cannot test async Server Components** (use E2E/integration)

2. **Integration Tests (20-30%)** - Vitest + Real Test Database
   - Location: `src/app/__tests__/*.integration.test.ts`
   - Uses `.env.test` with separate test database
   - Test Server Actions, RLS policies, complex data flows
   - **ALWAYS clean up test data in `afterAll` hooks**

3. **E2E Tests (10-20%)** - Playwright
   - Location: `e2e/*.spec.ts`
   - Page Object Models in `e2e/pages/`
   - Critical user flows (auth, forms, navigation)

**Coverage**: 80% minimum (enforced), 100% for utilities/business logic

### shadcn/ui Components

Add components: `npx shadcn@latest add [component-name]`

- Added to `src/components/ui/`
- Built on Radix UI + Tailwind
- Customizable after installation

### Route Protection

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
```

## Common Pitfalls (AVOID THESE)

1. **Supabase clients**: Don't mix client/server imports. Server version is async!
2. **Connection strings**: Use port 6543 for queries, 5432 ONLY for migrations
3. **RLS**: Enable on ALL user data tables or anyone can read/write everything
4. **Environment vars**: Never import `@/lib/env` in client components
5. **Type safety**: Run `npm run build` before pushing to catch errors early
6. **Prisma**: Regenerate client after schema changes or types won't match
7. **Git hooks**: Pre-commit runs lint/tests/format - fix before they block commits
8. **Testing**: Never test against production DB. Use `.env.test` database
9. **Server Actions**: Always validate on server even if validated on client
10. **API routes**: Don't call from server components - import directly

## Project-Specific Quirks

- **Error boundaries**: `error.tsx` files at route level catch React errors
- **Loading states**: `loading.tsx` files show during async Server Component loading
- **Example patterns**: Check `src/app/example-form/` for complete implementation reference
- **Test examples**: See `src/app/__tests__/example-form.integration.test.ts`
- **RLS migration**: Uses custom SQL in `prisma/migrations/sql/` directory
- **Test DB setup**: See `docs/TEST_DATABASE_SETUP.md` for separate Supabase test project

## Key Documentation

- `README.md` - Setup instructions
- `docs/RLS_SETUP.md` - Row-Level Security patterns
- `docs/TESTING_CHECKLIST.md` - Complete testing guide (4-week roadmap)
- `docs/TEST_DATABASE_SETUP.md` - Test database setup
- `docs/Best Practices for Full-Stack Development with Next.md` - Architecture patterns

## When You Repeat Yourself

If you find yourself giving the same instructions across multiple sessions, add them to this file.
