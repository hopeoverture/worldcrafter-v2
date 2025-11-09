# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `npm run dev` - Start Next.js development server on localhost:3000
- `npm run build` - Build production bundle (run this to catch type errors before deployment)
- `npm start` - Start production server

### Database Operations

- `npx prisma db push` - Push Prisma schema changes to Supabase database (quick dev workflow)
- `npm run db:migrate` - Create and apply a new Prisma migration (recommended for production)
- `npm run db:rls` - Apply Row-Level Security policies to Supabase database
- `npm run db:studio` - Open Prisma Studio GUI at localhost:5555 to view/edit data
- `npx prisma generate` - Regenerate Prisma Client after schema changes

### Testing

- `npm test` - Run Vitest unit tests in watch mode
- `npm run test:e2e` - Run Playwright E2E tests with Chromium
- `vitest related --run` - Run tests related to changed files (used in pre-commit)

### Code Quality

- `npm run lint` - Run ESLint checks
- `npm run format` - Format code with Prettier

## High-Level Architecture

### Tech Stack Overview

- **Framework**: Next.js 16 (App Router) with React 19
- **Database**: Supabase (PostgreSQL) accessed via Prisma ORM
- **Authentication**: Supabase Auth with SSR cookie-based sessions
- **Styling**: Tailwind CSS v4 + shadcn/ui component library
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack Query (React Query) for client-side data fetching
- **Testing**: Vitest (unit) + Playwright (E2E)

### Authentication Flow

This project uses **Supabase Auth with cookie-based sessions** for secure, SSR-friendly authentication:

1. **Session Management**: Supabase session stored in HTTP-only cookies (not localStorage)
2. **Middleware**: `src/middleware.ts` runs on every request to refresh auth session via `updateSession()` from `@/lib/supabase/middleware`
3. **User Sync**: Database triggers automatically create a `users` table record when someone signs up via Supabase Auth
4. **Profile Table**: The `User` model in Prisma (public.users) references auth.users(id) from Supabase Auth schema

**Client vs Server Supabase Clients**:

- Use `createClient()` from `@/lib/supabase/client` in client components
- Use `createClient()` from `@/lib/supabase/server` in server components/actions (this is async)
- Both respect Row-Level Security policies automatically

### Data Access Patterns

**Server Components (Recommended)**:

- Fetch data directly in async server components
- Can use either Prisma (`prisma.user.findMany()`) or Supabase client
- No API route needed - server components have direct database access
- Better security (no exposure of queries to client) and performance

**Client Components**:

- Use TanStack Query (`useQuery`, `useMutation`) for data fetching
- Call Next.js Route Handlers (API routes) or use Supabase client directly
- For mutations, prefer Server Actions over API routes when possible

**Important**: Never call API routes from server components - import server code directly instead.

### Database Architecture

**Two-Layer Database Access**:

1. **Prisma ORM** (`src/lib/prisma.ts`): Type-safe queries, migrations, schema management
2. **Supabase Client**: Real-time subscriptions, storage, auth integration

**Schema Design**:

- Prisma schema: `prisma/schema.prisma`
- Uses two connection strings:
  - `DATABASE_URL` (port 6543): Transaction pooler for queries (PgBouncer)
  - `DIRECT_DATABASE_URL` (port 5432): Direct connection for migrations
- Tables use snake_case (via `@@map`) but Prisma models use PascalCase

**Row-Level Security (RLS)**:

- RLS is enabled on the `users` table to enforce database-level access control
- Users can only read/update their own profile (enforced via `auth.uid()` policies)
- Apply RLS policies: `npm run db:rls` (runs script in `scripts/apply-rls-migration.js`)
- **Critical**: Always enable RLS on tables containing user data

### Environment Variables

**Required Variables**:

```
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
DATABASE_URL="postgresql://...6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://...5432/postgres"
```

**Important Patterns**:

- Server-only vars: Import from `@/lib/env` (never use in client components)
- Client vars: Must have `NEXT_PUBLIC_` prefix
- Never commit `.env` file to version control
- Scripts/tests: Auto-loaded via `dotenv/config` imports

### Form Handling Pattern

Standard form workflow in this codebase:

1. Define Zod schema in `src/lib/schemas/` for validation
2. Infer TypeScript type from schema: `type FormData = z.infer<typeof schema>`
3. Use React Hook Form with `zodResolver(schema)` in component
4. Submit to Server Action (preferred) or API route
5. Server validates again with same Zod schema before processing

**Example**:

```typescript
// Schema
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// Component
const form = useForm<z.infer<typeof userSchema>>({
  resolver: zodResolver(userSchema),
});
```

### Testing Strategy

**Unit Tests** (Vitest + React Testing Library):

- Located in `src/components/__tests__/`
- Use `jsdom` environment for React component tests
- **Limitation**: Cannot test async Server Components (test behavior via E2E instead)
- Run on every commit via Husky pre-commit hook

**E2E Tests** (Playwright):

- Located in `e2e/` directory
- Tests full user flows in real browser (Chromium)
- Playwright auto-starts dev server on localhost:3000
- Use for critical paths: auth flows, CRUD operations, multi-step workflows

### Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── layout.tsx         # Root layout (providers, global styles)
│   ├── page.tsx           # Homepage route
│   └── [route]/page.tsx   # Other routes
├── components/
│   ├── providers/         # React context providers (e.g., QueryClientProvider)
│   ├── ui/                # shadcn/ui components (Button, Dialog, etc.)
│   └── __tests__/         # Vitest component tests
├── lib/
│   ├── supabase/          # Supabase client utilities
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client (async)
│   │   └── middleware.ts  # Session refresh logic
│   ├── schemas/           # Zod validation schemas
│   ├── env.ts             # Server-side env variable loader
│   ├── prisma.ts          # Prisma client singleton
│   └── utils.ts           # Utility functions (cn, etc.)
└── middleware.ts          # Next.js middleware (auth session refresh)

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Migration files

scripts/
└── apply-rls-migration.js # RLS policy setup script

docs/
├── RLS_SETUP.md           # Row-Level Security guide
└── Best Practices for Full-Stack Development with Next.md
```

## Critical Development Patterns

### Adding New Database Tables

1. Update `prisma/schema.prisma` with new model
2. Run `npx prisma migrate dev --name add_table_name` (or `npx prisma db push` for dev)
3. Create RLS policies for the table (see `docs/RLS_SETUP.md` for patterns)
4. Apply RLS via SQL script or `npm run db:rls`
5. Generate Prisma client: `npx prisma generate` (auto-runs after migrate)

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Components are added to `src/components/ui/` and can be customized. They are built on Radix UI primitives and styled with Tailwind.

### Authentication Implementation

**To protect routes**: Check auth in middleware or page/layout:

```typescript
// In server component or route
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
```

**Profile data access**: Use Prisma to query the `users` table, which syncs with Supabase auth via database trigger.

### Server Actions vs API Routes

**Use Server Actions when**:

- Performing mutations (create, update, delete)
- Need direct database access with auth context
- Want co-located logic with components

**Use API Routes when**:

- Exposing data to external services
- Need custom HTTP methods or headers
- Building a public API

## Common Pitfalls

1. **Don't mix Supabase clients**: Use `@/lib/supabase/client` in client components, `@/lib/supabase/server` in server components (note: server version is async)

2. **Connection strings**: Always use `DATABASE_URL` (port 6543) for queries and `DIRECT_DATABASE_URL` (port 5432) for migrations

3. **RLS policies**: Enable RLS on all tables with user data, otherwise anyone can read/write all rows

4. **Environment variables**: Never import `@/lib/env` in client components - it contains server-only variables

5. **Type safety**: Run `npm run build` before pushing to catch TypeScript errors early

6. **Prisma Client**: After schema changes, regenerate client with `npx prisma generate` or it won't reflect new types

7. **Git hooks**: Pre-commit hooks run lint, tests, and format - fix errors before they block commits

## Key Documentation Files

- `README.md` - Setup instructions and tech stack overview
- `SUPABASE_SETUP.md` - Detailed Supabase configuration guide
- `docs/RLS_SETUP.md` - Row-Level Security patterns and implementation
- `docs/Best Practices for Full-Stack Development with Next.md` - Comprehensive architecture patterns

## Package Manager

This project uses **npm** (not pnpm or yarn). All scripts in package.json use npm.
