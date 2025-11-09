# WorldCrafter

Create and explore infinite procedurally generated worlds.

An immersive world-building and storytelling platform built with Next.js, TypeScript, and Supabase.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Initialize database
npx prisma db push
npm run db:rls

# 4. Start development
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Features

✅ **Database Ready**

- PostgreSQL via Supabase with Prisma ORM
- Row-Level Security (RLS) enabled for data protection
- Auto-sync between Supabase Auth and user profiles

✅ **Authentication Setup**

- Cookie-based SSR authentication with Supabase Auth
- Automatic session refresh via middleware
- Separate client/server Supabase utilities

✅ **Type Safety**

- Full TypeScript coverage
- Zod schema validation for forms
- Prisma type-safe database queries

✅ **Testing Infrastructure**

- Vitest for unit/component tests (80% coverage threshold)
- Playwright for E2E tests (Chromium, Firefox, Mobile Safari)
- Integration tests with real test database
- Pre-commit hooks run tests automatically
- Full CI/CD pipeline with E2E tests

✅ **Developer Experience**

- Hot reload with Next.js Turbopack
- Prettier + ESLint configured
- Git hooks for code quality
- Path aliases (`@/` imports)

✅ **Production Ready**

- Optimized for Vercel deployment
- Environment variable management
- Database connection pooling

## Tech Stack

### Core Framework

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library

### Database & Data Fetching

- **Supabase** - PostgreSQL database with built-in auth & storage
- **Prisma** - Type-safe ORM for PostgreSQL
- **TanStack Query** - Powerful data synchronization

### Form Handling & Validation

- **Zod** - TypeScript-first schema validation
- **React Hook Form** - Performant form library

### Testing

- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **Playwright** - End-to-end testing

### Code Quality

- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

### CI/CD

- **GitHub Actions** - Automated testing and builds

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- PostgreSQL client tools (optional, for RLS script - see setup step 6)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd worldcrafter
```

2. Install dependencies:

```bash
npm install
```

3. **Set up Supabase Project:**

   a. Create a new project at [https://supabase.com/dashboard](https://supabase.com/dashboard)

   b. Go to **Project Settings** → **API** and copy:
   - Project URL
   - `anon` `public` key

   c. Go to **Project Settings** → **Database** and copy:
   - Connection string (Transaction pooler mode)
   - Connection string (Session pooler mode - for migrations)

4. **Configure environment variables:**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

5. **Set up the database:**

   Push your Prisma schema to Supabase:

   ```bash
   npx prisma db push
   ```

   Or create a migration:

   ```bash
   npx prisma migrate dev --name init
   ```

6. **Apply Row-Level Security (RLS) policies:**

   Enable RLS on your database tables for security:

   **Option A: Using the RLS script (requires PostgreSQL client)**

   ```bash
   npm run db:rls
   ```

   **Option B: Using Supabase SQL Editor (no PostgreSQL client needed)**
   1. Go to your Supabase project dashboard
   2. Navigate to **SQL Editor**
   3. Copy the contents of `prisma/migrations/sql/001_enable_rls.sql`
   4. Paste and run the SQL in the editor

   This sets up database-level security policies. See [RLS Setup Guide](./docs/RLS_SETUP.md) for details.

7. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your app.

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing

**Unit & Integration Tests:**

- `npm test` - Run unit tests in watch mode (Vitest)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Open Vitest UI for interactive testing

**End-to-End Tests:**

- `npm run test:e2e` - Run E2E tests (Playwright)
- `npm run test:e2e:ui` - Open Playwright UI for debugging

**All Tests:**

- `npm run test:all` - Run all tests (unit + E2E) with coverage

### Code Quality

- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database

**Production Database:**

- `npm run db:migrate` - Create and apply migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:rls` - Apply Row-Level Security policies
- `npm run db:studio` - Open Prisma Studio GUI
- `npx prisma generate` - Generate Prisma Client

**Test Database:**

- `npm run db:test:sync` - Sync schema to test database (recommended)
- `npm run db:test:sync -- --seed` - Sync schema and seed test data
- `npm run db:test:push` - Push schema to test database
- `npm run db:test:seed` - Seed test database with sample data

**Note:** For setting up a separate test database, see [Test Database Setup Guide](docs/TEST_DATABASE_SETUP.md)

## Project Structure

```
worldcrafter/
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
├── .husky/              # Git hooks
│   └── pre-commit       # Pre-commit hook for linting & testing
├── docs/                # Documentation
│   ├── RLS_SETUP.md     # Row-Level Security guide
│   ├── TESTING_CHECKLIST.md  # Comprehensive testing implementation guide
│   ├── TEST_DATABASE_SETUP.md  # Test database setup and workflow guide
│   └── Best Practices for Full-Stack Development with Next.md
├── e2e/                 # Playwright E2E tests
│   ├── pages/           # Page Object Models (POM)
│   └── *.spec.ts        # E2E test files
├── prisma/
│   ├── migrations/      # Prisma migrations
│   │   └── sql/         # Custom SQL migrations (RLS)
│   └── schema.prisma    # Database schema
├── scripts/
│   ├── apply-rls-migration.mjs  # RLS policy application script
│   └── seed-test-db.mjs         # Test database seeding script
├── src/
│   ├── app/             # Next.js app directory (routes)
│   │   ├── __tests__/   # Integration tests for Server Actions
│   │   ├── example-form/
│   │   │   ├── actions.ts   # Server Actions example
│   │   │   ├── error.tsx    # Route-specific error boundary
│   │   │   ├── loading.tsx  # Route-specific loading state
│   │   │   └── page.tsx     # Form page with Server Action
│   │   ├── error.tsx    # Root error boundary
│   │   ├── loading.tsx  # Root loading state
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Homepage
│   ├── components/
│   │   ├── __tests__/   # Vitest component tests
│   │   ├── providers/   # React context providers
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── supabase/    # Supabase client utilities
│   │   │   ├── client.ts    # Browser client
│   │   │   ├── server.ts    # Server client (async)
│   │   │   └── middleware.ts # Session refresh
│   │   ├── env.ts       # Environment variable loader
│   │   ├── prisma.ts    # Prisma client singleton
│   │   └── utils.ts     # Utility functions
│   └── test/            # Testing utilities and mocks
│       ├── utils/       # Test helpers (custom render, etc.)
│       ├── mocks/       # Mock implementations (Supabase, Prisma)
│       ├── factories/   # Test data factories
│       └── fixtures/    # Static test data
├── middleware.ts        # Next.js middleware for auth
├── CLAUDE.md            # AI assistant instructions
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment variable template
├── .env.test            # Test environment variables (not committed)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

## Environment Variables

WorldCrafter uses `dotenv` for environment variable management:

- **Client-side**: Use Next.js `NEXT_PUBLIC_` prefix
- **Server-side**: Import from `@/lib/env` for validated access
- **Tests & Scripts**: Automatically loaded via dotenv

### Important Notes

- Never commit `.env` to version control
- All server-side env vars should be added to `src/lib/env.ts`
- Do not import `@/lib/env` in client components

## Example Pages

- `/` - Homepage (WorldCrafter landing page)
- `/example` - shadcn/ui button demo
- `/example-form` - Complete form example with:
  - Server Actions integration
  - Zod schema validation
  - React Hook Form
  - Loading states
  - Error boundaries
  - Success/error feedback UI

These example pages demonstrate the tech stack integration and best practices. They can be removed or customized as needed.

### Example Code Included

**Server Actions** (`src/app/example-form/actions.ts`):

- Server-side validation with Zod
- Authentication checks with Supabase
- Database operations with Prisma
- Typed error handling
- Cache revalidation

**Error Boundaries**:

- Root error boundary (`src/app/error.tsx`) - catches errors app-wide
- Route-specific error boundary (`src/app/example-form/error.tsx`) - contextual error messages

**Loading States**:

- Root loading UI (`src/app/loading.tsx`) - animated spinner
- Route-specific skeleton loader (`src/app/example-form/loading.tsx`) - matches form layout

**Integration Tests** (`src/app/__tests__/example-form.integration.test.ts`):

- Testing Server Actions with real database
- Proper test data cleanup patterns
- Multiple test scenarios

## Testing

WorldCrafter uses a comprehensive three-layer testing strategy:

### Testing Layers

1. **Unit Tests** (Vitest + React Testing Library)
   - Component testing with isolated unit tests
   - Business logic and utility function testing
   - Fast feedback loop with hot reload

2. **Integration Tests** (Vitest + Real Test Database)
   - Server Action testing with actual database operations
   - API route testing
   - Database query testing

3. **End-to-End Tests** (Playwright)
   - Full user flow testing in real browsers (Chromium, Firefox, Mobile Safari)
   - Critical path validation
   - Cross-browser compatibility testing
   - CI/CD integration

### Quick Start

```bash
# Run unit tests in watch mode
npm test

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Test Database Setup

For integration testing, create a separate test database:

1. Create a new Supabase project for testing (recommended) OR use local Supabase
2. Create `.env.test` with test database credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://test-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-test-anon-key"
DATABASE_URL="postgresql://..."  # Test database connection
DIRECT_DATABASE_URL="postgresql://..."  # Test database direct connection
```

3. Push schema to test database:

```bash
npm run db:test:push
```

4. Seed test data:

```bash
npm run db:test:seed
```

### Writing Tests

**Component Tests:**

```typescript
import { renderWithProviders, screen } from '@/test/utils/render';

test('renders button', () => {
  renderWithProviders(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

**Integration Tests:**

```typescript
import { prisma } from '@/lib/prisma';

test('creates user', async () => {
  const user = await prisma.user.create({ data: {...} });
  expect(user).toBeDefined();
});
```

**E2E Tests:**

```typescript
test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

### Coverage Goals

- **Overall:** 80%+ (enforced by coverage thresholds)
- **Components:** 85%+
- **Utilities:** 100%

### Testing Documentation

For detailed testing setup, best practices, and implementation guide, see:

- **[Testing Checklist](./docs/TESTING_CHECKLIST.md)** - Complete implementation guide with code examples
- **[Test Database Setup](./docs/TEST_DATABASE_SETUP.md)** - Guide for setting up separate test database
- Pre-commit hooks automatically run tests on changed files
- CI/CD pipeline runs full test suite on every push

## Using Supabase

WorldCrafter includes Supabase client utilities for both client and server components.

### Client Components

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function ClientComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return <div>User: {user?.email}</div>;
}
```

### Server Components

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ServerComponent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <div>User: {user?.email}</div>;
}
```

### API Routes / Server Actions

```tsx
"use server";

import { createClient } from "@/lib/supabase/server";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}
```

### Database Access

You can use either Supabase client or Prisma for database operations:

**Using Supabase:**

```tsx
const { data } = await supabase.from("users").select("*");
```

**Using Prisma (Recommended for complex queries):**

```tsx
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany();
```

## Server Actions

WorldCrafter includes comprehensive Server Actions examples demonstrating Next.js best practices.

### What are Server Actions?

Server Actions are asynchronous functions that run on the server. They enable you to:

- Perform mutations (create, update, delete) securely on the server
- Access databases and APIs without creating API routes
- Automatically get type safety between client and server
- Handle form submissions with progressive enhancement

### Example Implementation

See `src/app/example-form/actions.ts` for a complete example including:

```tsx
"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { userFormSchema } from "@/lib/schemas/user";

export async function submitUserForm(values: UserFormValues) {
  // 1. Server-side validation
  const validated = userFormSchema.parse(values);

  // 2. Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 3. Database operation
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: validated,
  });

  // 4. Return typed response
  return { success: true, data: updatedUser };
}
```

### Using Server Actions in Components

```tsx
"use client";

import { submitUserForm } from "./actions";

export default function MyForm() {
  async function onSubmit(values) {
    const result = await submitUserForm(values);
    if (result.success) {
      // Handle success
    }
  }

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

### Best Practices

✅ **Always validate on the server** - Never trust client input
✅ **Use Zod schemas** - Share validation between client and server
✅ **Return typed responses** - Use consistent `{ success, data?, error? }` pattern
✅ **Handle errors gracefully** - Return error messages, don't throw
✅ **Revalidate paths** - Use `revalidatePath()` for cache invalidation

See the `/example-form` page for a working implementation.

## Error Boundaries & Loading States

WorldCrafter includes examples of Next.js error boundaries and loading states for better user experience.

### Error Boundaries

Error boundaries catch runtime errors and display fallback UI instead of crashing the app.

**Root Error Boundary** (`src/app/error.tsx`):

- Catches errors anywhere in the application
- Shows error details in development mode
- Provides "Try again" and "Go to homepage" actions
- Displays error digest for production support

**Route-Specific Error Boundary** (`src/app/example-form/error.tsx`):

- Catches errors only within the `/example-form` route
- Provides contextual error messages (e.g., "Form submission failed")
- Keeps other parts of the app functional

```tsx
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
      <h1>Something went wrong</h1>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Loading States

Loading states provide visual feedback during navigation and data fetching.

**Root Loading State** (`src/app/loading.tsx`):

- Shows animated spinner during page transitions
- Displayed while any route is loading

**Route-Specific Loading State** (`src/app/example-form/loading.tsx`):

- Skeleton loader matching the form layout
- Prevents layout shift during loading
- Better perceived performance

```tsx
// loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
    </div>
  );
}
```

### Benefits

✅ **Better UX** - Users see helpful feedback instead of blank screens or crashes
✅ **Graceful degradation** - Errors don't crash the entire app
✅ **Route isolation** - Errors in one route don't affect others
✅ **Automatic handling** - Next.js automatically uses these files
✅ **No layout shift** - Skeleton loaders match final layout

## Security

### Row-Level Security (RLS)

This project uses **Supabase Row-Level Security (RLS)** to enforce database-level access control. RLS ensures that:

- Users can only access data they're authorized to see
- Security policies are enforced at the database level (not just in application code)
- Even if someone bypasses your API, your data remains protected

**Current RLS Policies:**

- ✅ Users can read their own profile
- ✅ Users can update their own profile
- ✅ Auto-sync with Supabase Auth

**Learn more:**

- Read the [RLS Setup Guide](./docs/RLS_SETUP.md) for detailed documentation
- Apply RLS policies: `npm run db:rls`

**Important:** Always enable RLS on tables containing user data. See the setup guide for examples of common RLS patterns.

## Testing Strategy

### Unit Tests (Vitest)

- Component testing with Testing Library
- Run automatically on `git commit` via Husky
- Located in `src/components/__tests__/`

### E2E Tests (Playwright)

- Full browser automation
- Run with `npm run test:e2e`
- Located in `e2e/`

## Git Hooks

Pre-commit hooks (via Husky + lint-staged):

- Lint and auto-fix TypeScript/JavaScript files
- Run tests for changed files
- Format code with Prettier

## CI/CD

GitHub Actions workflow runs on push/PR:

1. Install dependencies
2. Run linter (ESLint)
3. Run unit tests (Vitest)
4. Build project (Next.js production build)
5. Install Playwright browsers
6. Run E2E tests (Chromium, Firefox, Mobile Safari)

The complete CI/CD pipeline ensures code quality and functionality before deployment.

## Deployment

### Vercel + Supabase (Recommended)

WorldCrafter is optimized for deployment on Vercel with Supabase as the backend.

#### 1. Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
npm i -g vercel
vercel
```

**Option B: Using Vercel Dashboard**

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect Next.js settings

#### 2. Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@...
DIRECT_DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@...
```

#### 3. Run Database Migrations

After deployment, run migrations using Vercel CLI:

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

Or use Supabase's SQL editor to run migrations directly.

### Other Platforms

1. Build: `npm run build`
2. Start: `npm start`
3. Set all environment variables from `.env.example`

## Customization

### Adding Prisma Models

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Prisma Client is auto-generated

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

### Adding Routes

Create files in `src/app/` following Next.js App Router conventions.

## Known Issues

### Middleware Deprecation Warning

Next.js 16 shows a deprecation warning about the `middleware.ts` file convention:

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Impact:** This is only a warning and doesn't affect functionality. The middleware works correctly.

**Future Fix:** When you're ready to update:

1. Rename `src/middleware.ts` to `src/proxy.ts`
2. Update imports and follow Next.js 16 proxy conventions
3. See: https://nextjs.org/docs/messages/middleware-to-proxy

## Troubleshooting

### RLS Script Fails

If `npm run db:rls` fails with "psql: command not found":

**Solution:** Use Option B from the setup guide - apply RLS via Supabase SQL Editor instead.

### Database Connection Issues

- Ensure `DATABASE_URL` uses port **6543** (transaction pooler)
- Ensure `DIRECT_DATABASE_URL` uses port **5432** (direct connection)
- Check Supabase project is active and credentials are correct

### Prisma Client Not Generated

If you get "Cannot find module '@prisma/client'":

```bash
npx prisma generate
```

## Documentation

- **CLAUDE.md** - Comprehensive guide for AI assistant interactions and development commands
- **docs/RLS_SETUP.md** - Row-Level Security setup and patterns
- **docs/TESTING_CHECKLIST.md** - Complete testing implementation guide with 4-week roadmap
- **docs/Best Practices for Full-Stack Development with Next.md** - Architecture patterns and conventions

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
