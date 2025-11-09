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

**Unit & Integration Tests:**

- `npm test` - Run Vitest unit tests in watch mode
- `npm run test:coverage` - Run tests with coverage report (80% threshold)
- `npm run test:ui` - Open Vitest UI for interactive testing
- `vitest related --run` - Run tests related to changed files (used in pre-commit)

**End-to-End Tests:**

- `npm run test:e2e` - Run Playwright E2E tests (Chromium, Firefox, Mobile)
- `npm run test:e2e:ui` - Open Playwright UI for debugging tests

**Test Database:**

- `npm run db:test:sync` - Sync schema to test database (recommended workflow)
- `npm run db:test:sync -- --seed` - Sync schema and seed test data in one command
- `npm run db:test:push` - Push Prisma schema to test database
- `npm run db:test:seed` - Seed test database with sample data

**Setting up Test Database:**
See [Test Database Setup Guide](docs/TEST_DATABASE_SETUP.md) for complete instructions on creating a separate Supabase project for testing

**All Tests:**

- `npm run test:all` - Run all tests with coverage (unit + integration + E2E)

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

**Complete Example**:

See `src/app/example-form/` for a full implementation with:

- Schema: `src/lib/schemas/user.ts`
- Server Action: `src/app/example-form/actions.ts`
- Client Component: `src/app/example-form/page.tsx`
- Integration Test: `src/app/__tests__/example-form.integration.test.ts`

```typescript
// 1. Schema (src/lib/schemas/user.ts)
export const userFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

// 2. Server Action (src/app/example-form/actions.ts)
("use server");
export async function submitUserForm(values: UserFormValues) {
  const validated = userFormSchema.parse(values);
  // Database operation...
  return { success: true, data: validated };
}

// 3. Client Component (src/app/example-form/page.tsx)
("use client");
const form = useForm<UserFormValues>({
  resolver: zodResolver(userFormSchema),
});

async function onSubmit(values: UserFormValues) {
  const result = await submitUserForm(values);
  // Handle result...
}
```

### Testing Strategy

WorldCrafter uses a **three-layer testing pyramid** for comprehensive coverage:

**1. Unit Tests** (Vitest + React Testing Library) - 60-70% of tests:

- **Location**: `src/components/__tests__/`, `src/lib/__tests__/`, `src/app/__tests__/`
- **Purpose**: Test components, utilities, and pure functions in isolation
- **Environment**: `jsdom` for React component testing
- **Test Utilities**: Use `renderWithProviders()` from `@/test/utils/render` for components
- **Mocking**: Supabase and Prisma clients are mocked (see `src/test/mocks/`)
- **Data Factories**: Use factories from `src/test/factories/` for test data generation
- **Limitation**: Cannot test async Server Components (use E2E or integration tests instead)
- **Coverage Goal**: 80%+ (enforced by Vitest coverage thresholds)

**2. Integration Tests** (Vitest + Real Test Database) - 20-30% of tests:

- **Location**: `src/app/__tests__/*.integration.test.ts`
- **Example**: `src/app/__tests__/example-form.integration.test.ts` - Server Action testing pattern
- **Purpose**: Test Server Actions, database operations, and API routes with real database
- **Database**: Uses separate test database (configured in `.env.test`)
- **Setup**: Runs `beforeAll`/`afterAll` hooks for database seeding and cleanup
- **Best for**: Testing database queries, RLS policies, Server Actions, complex data flows
- **Important**: Always clean up test data after tests complete

**3. E2E Tests** (Playwright) - 10-20% of tests:

- **Location**: `e2e/` directory with `*.spec.ts` files
- **Purpose**: Test complete user flows in real browsers
- **Browsers**: Chromium, Firefox, and Mobile (iPhone 13) viewports
- **Page Objects**: Use Page Object Models from `e2e/pages/` for maintainability
- **Auto-start**: Playwright automatically starts dev server on localhost:3000
- **Best for**: Critical paths (auth flows, form submissions, navigation, multi-step workflows)
- **CI/CD**: Tests against production build in CI for realistic testing

**Test Data Management**:

- **Factories**: `src/test/factories/user.ts` - Use `createMockUser()` for test data
- **Fixtures**: `src/test/fixtures/` - Static test data (JSON files)
- **Seeding**: `npm run db:test:seed` - Seed test database with sample data
- **Mocks**: `src/test/mocks/` - Mock Supabase/Prisma for unit tests

**Testing Best Practices**:

1. **Query Priority**: Use role-based queries (`getByRole`) over test IDs or classes
2. **Test Behavior**: Test what users see/do, not implementation details
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Cleanup**: Use `beforeEach`/`afterEach` for proper setup/teardown
5. **Coverage**: Aim for 80%+ overall, 100% for utilities and critical business logic
6. **Pre-commit**: Tests run automatically on staged files before commit
7. **Server Components**: Test via E2E or integration tests, not unit tests

**Writing Tests - Examples**:

```typescript
// Unit Test (Component)
import { renderWithProviders, screen } from '@/test/utils/render';

test('renders button', () => {
  renderWithProviders(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});

// Integration Test (Database)
import { prisma } from '@/lib/prisma';
import { createMockUser } from '@/test/factories/user';

test('creates user in database', async () => {
  const user = await prisma.user.create({
    data: createMockUser({ email: 'test@example.com' })
  });
  expect(user).toBeDefined();
});

// E2E Test (User Flow)
import { HomePage } from './pages/home.page';

test('homepage loads correctly', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  await expect(home.heading).toBeVisible();
});
```

**Test Environment Setup**:

- **Unit/Integration**: Uses `.env.test` for test database credentials
- **E2E**: Uses dev environment by default, production build in CI
- **Database**: Separate Supabase project or local Supabase instance for testing
- **Coverage**: HTML reports generated in `coverage/` directory

**For detailed testing setup and implementation guide, see `docs/TESTING_CHECKLIST.md`**

### Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── __tests__/         # Integration tests for Server Actions
│   │   └── example-form.integration.test.ts  # Example integration test
│   ├── example-form/      # Example form route with complete patterns
│   │   ├── actions.ts     # Server Actions example
│   │   ├── error.tsx      # Route-specific error boundary
│   │   ├── loading.tsx    # Route-specific loading state
│   │   └── page.tsx       # Form page component
│   ├── error.tsx          # Root error boundary
│   ├── loading.tsx        # Root loading state
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
├── test/                   # Testing utilities and mocks
│   ├── utils/             # Test helpers (renderWithProviders, etc.)
│   ├── mocks/             # Mock implementations (Supabase, Prisma, Next.js)
│   ├── factories/         # Test data factories (createMockUser, etc.)
│   └── fixtures/          # Static test data (JSON files)
└── middleware.ts          # Next.js middleware (auth session refresh)

e2e/                        # Playwright E2E tests
├── pages/                 # Page Object Models (POM)
└── *.spec.ts              # E2E test files

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Migration files
    └── sql/               # Custom SQL migrations (RLS policies)

scripts/
├── apply-rls-migration.mjs # RLS policy setup script
└── seed-test-db.mjs        # Test database seeding script

docs/
├── RLS_SETUP.md            # Row-Level Security guide
├── TESTING_CHECKLIST.md    # Complete testing implementation guide
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
- Building form submission handlers

**Use API Routes when**:

- Exposing data to external services
- Need custom HTTP methods or headers
- Building a public API
- Webhooks or third-party integrations

### Server Actions Pattern

See `src/app/example-form/actions.ts` for a complete implementation. The standard pattern is:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { yourSchema } from "@/lib/schemas/your-schema";

export async function yourServerAction(values: YourSchemaType) {
  try {
    // 1. Server-side validation (ALWAYS validate)
    const validated = yourSchema.parse(values);

    // 2. Authentication check (if required)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Database operation
    const result = await prisma.yourModel.create({
      data: validated,
    });

    // 4. Revalidate cached pages
    revalidatePath("/your-route");

    // 5. Return typed response
    return { success: true, data: result };
  } catch (error) {
    // Handle errors gracefully
    return { success: false, error: "Operation failed" };
  }
}
```

**Client Usage**:

```typescript
"use client";

import { yourServerAction } from "./actions";

function YourComponent() {
  async function handleSubmit(values) {
    const result = await yourServerAction(values);

    if (result.success) {
      // Handle success
    } else {
      // Handle error: result.error
    }
  }

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Key Benefits**:

- Type-safe communication between client and server
- No need to create API routes
- Automatic serialization of responses
- Progressive enhancement support
- Co-located with page components

### Error Boundaries & Loading States

WorldCrafter includes examples of Next.js error boundaries and loading states for better UX.

**Error Boundaries**:

Error boundaries catch React errors and display fallback UI. Next.js automatically uses `error.tsx` files:

- `src/app/error.tsx` - Root error boundary (catches errors app-wide)
- `src/app/example-form/error.tsx` - Route-specific error boundary

**Pattern**:

```typescript
// error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

**Loading States**:

Loading states provide visual feedback during navigation and data fetching. Next.js automatically uses `loading.tsx` files:

- `src/app/loading.tsx` - Root loading state (shows during any page transition)
- `src/app/example-form/loading.tsx` - Route-specific skeleton loader

**Pattern**:

```typescript
// loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
    </div>
  );
}
```

**Best Practices**:

- **Root-level files**: Provide default error/loading UI for entire app
- **Route-specific files**: Override defaults with contextual UI
- **Skeleton loaders**: Match the layout of the actual content to prevent layout shift
- **Error details**: Show error messages in development, hide in production
- **Reset functionality**: Always provide a way to retry or navigate away

**When to use**:

- Error boundaries: Any route where errors might occur (forms, data fetching)
- Loading states: Routes with async Server Components or slow data fetching

## Common Pitfalls

1. **Don't mix Supabase clients**: Use `@/lib/supabase/client` in client components, `@/lib/supabase/server` in server components (note: server version is async)

2. **Connection strings**: Always use `DATABASE_URL` (port 6543) for queries and `DIRECT_DATABASE_URL` (port 5432) for migrations

3. **RLS policies**: Enable RLS on all tables with user data, otherwise anyone can read/write all rows

4. **Environment variables**: Never import `@/lib/env` in client components - it contains server-only variables

5. **Type safety**: Run `npm run build` before pushing to catch TypeScript errors early

6. **Prisma Client**: After schema changes, regenerate client with `npx prisma generate` or it won't reflect new types

7. **Git hooks**: Pre-commit hooks run lint, tests, and format - fix errors before they block commits

8. **Testing**: Use `.env.test` for test database configuration. Never run tests against production database. Always clean up test data in `afterAll` hooks

## Key Documentation Files

- `README.md` - Setup instructions and tech stack overview
- `SUPABASE_SETUP.md` - Detailed Supabase configuration guide
- `docs/RLS_SETUP.md` - Row-Level Security patterns and implementation
- `docs/TESTING_CHECKLIST.md` - Complete testing implementation guide with 4-week roadmap, best practices, and code examples
- `docs/TEST_DATABASE_SETUP.md` - Step-by-step guide for setting up separate test database and keeping it in sync
- `docs/Best Practices for Full-Stack Development with Next.md` - Comprehensive architecture patterns

## Package Manager

This project uses **npm** (not pnpm or yarn). All scripts in package.json use npm.
