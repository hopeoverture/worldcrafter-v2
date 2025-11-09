# WorldCrafter Testing Implementation Checklist

> **Goal:** Implement production-ready testing infrastructure following 2025 best practices for Next.js 16, React 19, Vitest, Playwright, Supabase, and Prisma.

**Target Coverage:** 80%+ | **Current Coverage:** 100% (1 test) - Phase 1 Foundation Complete ✅

---

## ✅ Phase 1 Completion Summary

**Status:** COMPLETE ✅
**Completed:** 2025-01-09
**Tasks Completed:** 10/10

### What Was Implemented:

1. **Dependencies Installed** (1.1)
   - vitest-mock-extended, @vitest/coverage-v8, dotenv-cli, msw

2. **Test Environment** (1.2)
   - `.env.test` file created
   - `.env.example` updated with test configuration

3. **Package Scripts** (1.3)
   - `test`, `test:ui`, `test:coverage` - Unit tests with coverage
   - `test:e2e`, `test:e2e:ui` - E2E tests
   - `test:all` - Run all tests
   - `db:test:push`, `db:test:seed` - Test database management

4. **Coverage Reporting** (1.4)
   - v8 provider configured
   - 80% coverage thresholds enforced
   - Multiple reporters (text, json, html, lcov)

5. **Test Infrastructure** (1.5-1.10)
   - Directory structure: `src/test/{utils,mocks,factories,fixtures}/`
   - Custom `renderWithProviders()` utility
   - Supabase client mocks with reset utility
   - Prisma client mocks with vitest-mock-extended
   - User factory for test data generation
   - Database seed script ready to use

### Infrastructure Ready For:

- ✅ Unit testing with React Testing Library
- ✅ Integration testing with test database
- ✅ Mocked Supabase and Prisma clients
- ✅ Test data factories and fixtures
- ✅ Coverage reporting and enforcement

---

## 📊 Current Status Assessment

### ✅ What's Already Done

- [x] Vitest configured with jsdom environment
- [x] Playwright configured with auto-start dev server
- [x] React Testing Library installed
- [x] Pre-commit hooks for running tests
- [x] TypeScript integration
- [x] Basic example tests (1 unit, 1 E2E)

### ❌ Critical Gaps Identified

- [x] No test database configuration - **COMPLETED** (.env.test created)
- [x] No mocking infrastructure - **COMPLETED** (Supabase & Prisma mocks)
- [x] No test utilities/helpers - **COMPLETED** (renderWithProviders, factories)
- [x] No coverage reporting - **COMPLETED** (v8 with 80% thresholds)
- [ ] Minimal test coverage (currently 100% but only 1 test)
- [ ] No integration tests
- [ ] No database testing strategy - **PARTIAL** (seed script ready, needs tests)

---

## Phase 1: Foundation (Week 1) 🎯 PRIORITY

### 1.1 Install Dependencies

```bash
npm install -D vitest-mock-extended @vitest/coverage-v8 dotenv-cli msw
```

**Checklist:**

- [x] Install `vitest-mock-extended` for type-safe mocking
- [x] Install `@vitest/coverage-v8` for coverage reporting
- [x] Install `dotenv-cli` for test environment variables
- [x] Install `msw` (Mock Service Worker) for API mocking
- [x] Verify all packages in `package.json`

---

### 1.2 Configure Test Database

**Create `.env.test` file:**

```env
# Test Environment Variables
# Use a separate Supabase project OR local Supabase instance

NEXT_PUBLIC_SUPABASE_URL="https://test-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-test-anon-key"

# Test Database URLs (port 6543 for pooled, 5432 for direct)
DATABASE_URL="postgresql://postgres.test-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://postgres.test-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Node environment
NODE_ENV="test"
```

**Checklist:**

- [x] Create `.env.test` file in project root
- [ ] Set up separate Supabase project for testing (recommended) - Using dev DB for now
- [ ] Install Supabase CLI for local development (`npx supabase init`)
- [x] Add `.env.test` to `.gitignore` (verify it's there) - Already covered by .env\*
- [x] Update `.env.example` with test environment example
- [x] Test connection to test database

---

### 1.3 Update Package Scripts

**Update `package.json` scripts section:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "dotenv -e .env.test -- vitest",
    "test:ui": "dotenv -e .env.test -- vitest --ui",
    "test:coverage": "dotenv -e .env.test -- vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:coverage && npm run test:e2e",
    "format": "prettier --write .",
    "lint-staged": "lint-staged",
    "prepare": "husky",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:rls": "node scripts/apply-rls-migration.mjs",
    "db:studio": "prisma studio",
    "db:test:push": "dotenv -e .env.test -- prisma db push",
    "db:test:seed": "dotenv -e .env.test -- node scripts/seed-test-db.mjs"
  }
}
```

**Checklist:**

- [x] Update `test` script to use `.env.test`
- [x] Add `test:ui` script for Vitest UI
- [x] Add `test:coverage` script
- [x] Add `test:e2e:ui` script for Playwright UI
- [x] Add `test:all` script to run all tests
- [x] Add `db:test:push` for test database schema
- [x] Add `db:test:seed` for test data seeding
- [x] Test all new scripts work

---

### 1.4 Configure Coverage Reporting

**Update `vitest.config.ts`:**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
import "dotenv/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "e2e/",
        ".next/",
        "**/*.config.ts",
        "**/*.config.js",
        "**/*.d.ts",
        "**/types/**",
        "**/__tests__/**",
        "scripts/**",
        "public/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Checklist:**

- [x] Update `vitest.config.ts` with coverage configuration
- [x] Set coverage provider to `v8`
- [x] Configure reporters (text, json, html, lcov)
- [x] Set coverage thresholds to 80%
- [x] Add coverage exclusions
- [x] Add `coverage/` to `.gitignore` - Already covered
- [x] Run `npm run test:coverage` to verify setup

---

### 1.5 Create Test Utilities Directory Structure

**Create the following directory structure:**

```
src/
└── test/
    ├── utils/
    │   ├── render.tsx          # Custom render with providers
    │   └── test-helpers.ts     # Shared test utilities
    ├── mocks/
    │   ├── supabase.ts         # Supabase client mocks
    │   ├── prisma.ts           # Prisma client mocks
    │   └── next-router.ts      # Next.js router mocks
    ├── factories/
    │   └── user.ts             # User data factory
    └── fixtures/
        └── users.json          # Test data fixtures
```

**Checklist:**

- [x] Create `src/test/` directory
- [x] Create `src/test/utils/` subdirectory
- [x] Create `src/test/mocks/` subdirectory
- [x] Create `src/test/factories/` subdirectory
- [x] Create `src/test/fixtures/` subdirectory

---

### 1.6 Create Custom Render Utility

**Create `src/test/utils/render.tsx`:**

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';

// Create a test query client with disabled retries
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with necessary providers
 * Usage: renderWithProviders(<MyComponent />)
 */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

**Checklist:**

- [x] Create `src/test/utils/render.tsx`
- [x] Implement `createTestQueryClient()` function
- [x] Implement `renderWithProviders()` function
- [x] Re-export RTL utilities
- [x] Test the custom render works

---

### 1.7 Create Supabase Mocks

**Create `src/test/mocks/supabase.ts`:**

```typescript
import { vi } from "vitest";

export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  })),
};

// Mock the Supabase client modules
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mockSupabaseClient,
}));

export function resetSupabaseMocks() {
  Object.values(mockSupabaseClient.auth).forEach((fn) => {
    if (typeof fn === "function") fn.mockClear();
  });
}
```

**Checklist:**

- [x] Create `src/test/mocks/supabase.ts`
- [x] Implement mock auth methods
- [x] Implement mock database query methods
- [x] Add mock reset utility
- [x] Test mocks work in a sample test

---

### 1.8 Create Prisma Mocks

**Create `src/test/mocks/prisma.ts`:**

```typescript
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach, vi } from "vitest";

// Create a deeply mocked Prisma client
export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock the Prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
```

**Checklist:**

- [x] Create `src/test/mocks/prisma.ts`
- [x] Import and setup `vitest-mock-extended`
- [x] Create `prismaMock` instance
- [x] Add `beforeEach` reset
- [x] Mock the Prisma module
- [x] Test mock works in a sample test

---

### 1.9 Create User Factory

**Create `src/test/factories/user.ts`:**

```typescript
import { User } from "@prisma/client";

let userIdCounter = 1;

/**
 * Factory function to create mock User objects for testing
 * Usage: const user = createMockUser({ email: 'custom@test.com' })
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id ?? `test-user-${userIdCounter++}`;
  const timestamp = new Date();

  return {
    id,
    email: overrides?.email ?? `user${userIdCounter}@test.com`,
    name: overrides?.name ?? `Test User ${userIdCounter}`,
    createdAt: overrides?.createdAt ?? timestamp,
    updatedAt: overrides?.updatedAt ?? timestamp,
    ...overrides,
  };
}

/**
 * Create multiple mock users
 * Usage: const users = createMockUsers(5)
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, () => createMockUser());
}

/**
 * Reset the counter (useful in beforeEach hooks)
 */
export function resetUserFactory() {
  userIdCounter = 1;
}
```

**Checklist:**

- [x] Create `src/test/factories/user.ts`
- [x] Implement `createMockUser()` function
- [x] Implement `createMockUsers()` function
- [x] Implement `resetUserFactory()` function
- [x] Add JSDoc comments
- [x] Test factory creates valid user objects

---

### 1.10 Create Database Seed Script

**Create `scripts/seed-test-db.mjs`:**

```javascript
#!/usr/bin/env node

/**
 * Seed Test Database
 *
 * This script seeds the test database with sample data for testing
 * Run: npm run db:test:seed
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.user.deleteMany({});

  // Create test users
  console.log("Creating test users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "test-user-1",
        email: "test1@example.com",
        name: "Test User 1",
      },
    }),
    prisma.user.create({
      data: {
        id: "test-user-2",
        email: "test2@example.com",
        name: "Test User 2",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);
  console.log("🌱 Test database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding test database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Checklist:**

- [x] Create `scripts/seed-test-db.mjs`
- [x] Import Prisma and dotenv
- [x] Implement data clearing logic
- [x] Implement test user creation
- [x] Add error handling
- [x] Test script runs: `npm run db:test:seed`
- [ ] Verify data appears in test database - Ready when separate test DB is set up

---

## Phase 2: Expand Test Coverage (Week 2)

### 2.1 Component Unit Tests

**Target: 20 component tests**

**Example: Create `src/components/ui/__tests__/button.test.tsx`:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/render';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    renderWithProviders(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles correctly', () => {
    const { rerender } = renderWithProviders(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Cancel</Button>);
    expect(button).toHaveClass('border');
  });
});
```

**Checklist:**

- [ ] Test `Button` component (4+ tests)
- [ ] Test `Dialog` component (if using)
- [ ] Test `DropdownMenu` component (if using)
- [ ] Test `Label` component (if using)
- [ ] Test custom components in `src/components/`
- [ ] Test `QueryProvider` component
- [ ] Aim for 80%+ component coverage

---

### 2.2 Page Component Tests

**Create `src/app/__tests__/page.test.tsx`:**

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils/render';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the heading', () => {
    renderWithProviders(<Home />);

    expect(
      screen.getByRole('heading', { name: /worldcrafter/i })
    ).toBeInTheDocument();
  });

  it('renders the description', () => {
    renderWithProviders(<Home />);

    expect(
      screen.getByText(/create and explore infinite procedurally generated worlds/i)
    ).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    const { container } = renderWithProviders(<Home />);

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
  });
});
```

**Checklist:**

- [ ] Test `app/page.tsx` (homepage)
- [ ] Test `app/example/page.tsx`
- [ ] Test `app/example-form/page.tsx`
- [ ] Test any other page components
- [ ] Verify proper semantics (headings, landmarks)

---

### 2.3 Utility Function Tests

**Create tests for functions in `src/lib/utils.ts`:**

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className utility)", () => {
  it("merges class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "conditional", "always")).toBe("base always");
  });

  it("handles Tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
```

**Checklist:**

- [ ] Test `cn()` utility function
- [ ] Test any custom utilities in `src/lib/utils.ts`
- [ ] Test environment variable loader (`src/lib/env.ts`) if applicable
- [ ] Aim for 100% utility coverage

---

### 2.4 Integration Tests for Database Operations

**Create `src/app/__tests__/user.integration.test.ts`:**

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createMockUser } from "@/test/factories/user";

// Integration test - uses real test database
describe("User Database Operations (Integration)", () => {
  const testEmail = "integration-test@example.com";

  beforeAll(async () => {
    // Ensure test database is clean
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
  });

  afterAll(async () => {
    // Cleanup after all tests
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });
    await prisma.$disconnect();
  });

  it("creates a new user", async () => {
    const userData = createMockUser({ email: testEmail });

    const user = await prisma.user.create({
      data: userData,
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.id).toBeDefined();
  });

  it("fetches user by email", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
  });

  it("updates user name", async () => {
    const newName = "Updated Name";

    const updated = await prisma.user.update({
      where: { email: testEmail },
      data: { name: newName },
    });

    expect(updated.name).toBe(newName);
  });

  it("deletes user", async () => {
    await prisma.user.delete({
      where: { email: testEmail },
    });

    const deleted = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(deleted).toBeNull();
  });
});
```

**Checklist:**

- [ ] Create integration tests for User CRUD operations
- [ ] Test database queries with real test database
- [ ] Add proper setup/teardown (beforeAll, afterAll)
- [ ] Test edge cases (duplicate emails, not found, etc.)
- [ ] Run tests: `npm run test` (should use .env.test)

---

### 2.5 Form Validation Tests

**If you have forms, test Zod schemas:**

**Create `src/lib/schemas/__tests__/user.test.ts`:**

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

// Example schema (adjust based on your actual schemas)
const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
});

describe("User Schema Validation", () => {
  it("validates correct user data", () => {
    const validData = {
      email: "test@example.com",
      name: "Test User",
    };

    const result = userSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const invalidData = {
      email: "not-an-email",
      name: "Test User",
    };

    const result = userSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email address");
    }
  });

  it("rejects empty name", () => {
    const invalidData = {
      email: "test@example.com",
      name: "",
    };

    const result = userSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

**Checklist:**

- [ ] Test all Zod schemas in `src/lib/schemas/`
- [ ] Test valid data passes validation
- [ ] Test invalid data is rejected
- [ ] Test error messages are correct
- [ ] Aim for 100% schema coverage

---

## Phase 3: E2E Test Expansion (Week 3)

### 3.1 Create Page Object Models

**Create `e2e/pages/home.page.ts`:**

```typescript
import { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly description: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /worldcrafter/i });
    this.description = page.getByText(/create and explore infinite/i);
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: "visible" });
  }
}
```

**Checklist:**

- [ ] Create `e2e/pages/` directory
- [ ] Create `HomePage` page object
- [ ] Create page objects for other major pages
- [ ] Use role-based locators (getByRole, getByLabel)
- [ ] Add helper methods for common actions

---

### 3.2 Expand E2E Test Suite

**Create `e2e/homepage.spec.ts`:**

```typescript
import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test.describe("Homepage", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("displays the correct title", async ({ page }) => {
    await expect(page).toHaveTitle(/WorldCrafter/);
  });

  test("renders main heading", async () => {
    await expect(homePage.heading).toBeVisible();
  });

  test("renders description", async () => {
    await expect(homePage.description).toBeVisible();
  });

  test("has proper semantic HTML structure", async ({ page }) => {
    await expect(page.locator("main")).toBeVisible();
  });
});
```

**Checklist:**

- [ ] Expand `e2e/example.spec.ts` or create `e2e/homepage.spec.ts`
- [ ] Use Page Object Models
- [ ] Test at least 5 critical user flows
- [ ] Test form submissions (when you add them)
- [ ] Test navigation between pages
- [ ] Test responsive behavior (mobile viewport)

---

### 3.3 Update Playwright Configuration

**Update `playwright.config.ts`:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Test against production build in CI
  webServer: process.env.CI
    ? {
        command: "npm run build && npm start",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120000,
      }
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
      },
});
```

**Checklist:**

- [ ] Update `playwright.config.ts`
- [ ] Add Firefox browser project
- [ ] Add mobile viewport project
- [ ] Configure screenshot on failure
- [ ] Test production build in CI
- [ ] Use GitHub reporter in CI
- [ ] Run tests across all projects: `npm run test:e2e`

---

### 3.4 Authentication Flow E2E Tests

**Create `e2e/auth.spec.ts` (when you implement auth):**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.skip("user can sign up", async ({ page }) => {
    // TODO: Implement when auth pages are built
    await page.goto("/signup");
    // ... test signup flow
  });

  test.skip("user can sign in", async ({ page }) => {
    // TODO: Implement when auth pages are built
    await page.goto("/login");
    // ... test login flow
  });

  test.skip("user can sign out", async ({ page }) => {
    // TODO: Implement when auth pages are built
  });
});
```

**Checklist:**

- [ ] Create `e2e/auth.spec.ts`
- [ ] Add placeholder tests with `test.skip`
- [ ] Implement tests when auth pages are built
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test sign out flow
- [ ] Test protected routes redirect to login

---

## Phase 4: CI/CD & Advanced Testing (Week 4)

### 4.1 GitHub Actions Workflow

**Create `.github/workflows/test.yml`:**

```yaml
name: Tests

on:
  push:
    branches: [master, main, develop]
  pull_request:
    branches: [master, main, develop]

jobs:
  unit-tests:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          DIRECT_DATABASE_URL: ${{ secrets.TEST_DIRECT_DATABASE_URL }}

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  build:
    name: Build Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
```

**Checklist:**

- [ ] Create `.github/workflows/` directory
- [ ] Create `test.yml` workflow file
- [ ] Add unit test job
- [ ] Add E2E test job
- [ ] Add build check job
- [ ] Configure test database secrets in GitHub
- [ ] Add coverage upload to Codecov (optional)
- [ ] Test workflow runs on push/PR

---

### 4.2 Add GitHub Secrets

**In your GitHub repository settings:**

**Checklist:**

- [ ] Go to Settings → Secrets and variables → Actions
- [ ] Add `TEST_SUPABASE_URL`
- [ ] Add `TEST_SUPABASE_ANON_KEY`
- [ ] Add `TEST_DATABASE_URL`
- [ ] Add `TEST_DIRECT_DATABASE_URL`
- [ ] Verify secrets are available in workflows

---

### 4.3 Create Testing Documentation

**Create `docs/TESTING.md`:**

```markdown
# Testing Guide

## Overview

WorldCrafter uses a comprehensive testing strategy with three layers:

- **Unit Tests** (Vitest + React Testing Library)
- **Integration Tests** (Vitest + Real Test Database)
- **E2E Tests** (Playwright)

## Running Tests

### Unit Tests

\`\`\`bash
npm test # Watch mode
npm run test:coverage # With coverage report
npm run test:ui # Vitest UI
\`\`\`

### E2E Tests

\`\`\`bash
npm run test:e2e # Headless
npm run test:e2e:ui # Playwright UI
\`\`\`

### All Tests

\`\`\`bash
npm run test:all # Run everything
\`\`\`

## Writing Tests

### Component Tests

Use the custom `renderWithProviders()` helper:

\`\`\`typescript
import { renderWithProviders, screen } from '@/test/utils/render';

test('renders component', () => {
renderWithProviders(<MyComponent />);
expect(screen.getByRole('button')).toBeInTheDocument();
});
\`\`\`

### Integration Tests

Use the real test database:

\`\`\`typescript
import { prisma } from '@/lib/prisma';

test('creates user', async () => {
const user = await prisma.user.create({ data: {...} });
expect(user).toBeDefined();
});
\`\`\`

### E2E Tests

Use Page Object Models:

\`\`\`typescript
import { HomePage } from './pages/home.page';

test('homepage loads', async ({ page }) => {
const home = new HomePage(page);
await home.goto();
await expect(home.heading).toBeVisible();
});
\`\`\`

## Test Data

Use factories for creating test data:

\`\`\`typescript
import { createMockUser } from '@/test/factories/user';

const user = createMockUser({ email: 'custom@test.com' });
\`\`\`

## Best Practices

1. **Query Priority**: Use role-based queries (`getByRole`) over test IDs
2. **Test Behavior**: Test what users see/do, not implementation details
3. **Isolation**: Each test should be independent
4. **Cleanup**: Use beforeEach/afterEach for setup/teardown
5. **Mocking**: Mock external dependencies (Supabase, Prisma) in unit tests

## Coverage Goals

- **Overall**: 80%+
- **Components**: 85%+
- **Utilities**: 100%
- **Business Logic**: 90%+
```

**Checklist:**

- [ ] Create `docs/TESTING.md`
- [ ] Document running tests
- [ ] Document writing tests
- [ ] Add code examples
- [ ] Document best practices
- [ ] Link from main README.md

---

### 4.4 Optional: Visual Regression Testing

**Using Playwright's built-in screenshot testing:**

```typescript
import { test, expect } from "@playwright/test";

test("homepage visual regression", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png");
});
```

**Checklist:**

- [ ] Add screenshot tests to critical pages
- [ ] Generate baseline screenshots
- [ ] Configure screenshot comparison threshold
- [ ] Store screenshots in version control or CI artifacts
- [ ] Update screenshots when UI changes intentionally

---

### 4.5 Optional: Accessibility Testing

**Install @axe-core/playwright:**

```bash
npm install -D @axe-core/playwright
```

**Create `e2e/accessibility.spec.ts`:**

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("homepage has no accessibility violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

**Checklist:**

- [ ] Install `@axe-core/playwright`
- [ ] Create accessibility test file
- [ ] Test all major pages
- [ ] Fix any violations found
- [ ] Add to CI pipeline

---

## 📊 Progress Tracking

### Overall Progress

- [x] Phase 1: Foundation (10/10 tasks) ✅ **COMPLETED**
- [ ] Phase 2: Expand Coverage (0/5 sections)
- [ ] Phase 3: E2E Expansion (0/4 sections)
- [ ] Phase 4: CI/CD & Advanced (0/5 sections)

### Coverage Milestones

- [ ] 20% coverage achieved
- [ ] 40% coverage achieved
- [ ] 60% coverage achieved
- [ ] 80% coverage achieved ⭐ GOAL

### Test Count Milestones

- [ ] 10 tests written
- [ ] 25 tests written
- [ ] 50 tests written
- [ ] 100 tests written

---

## 🎯 Quick Wins (Do These First)

**High-impact tasks you can complete today:**

1. [x] Install test dependencies (15 min) ✅
2. [x] Add coverage reporting to vitest.config.ts (15 min) ✅
3. [x] Create test utilities directory structure (10 min) ✅
4. [x] Create custom render utility (30 min) ✅
5. [x] Create User factory (20 min) ✅
6. [ ] Write 5 component tests (60 min) - **NEXT STEP**
7. [x] Update package.json scripts (10 min) ✅
8. [x] Run coverage report: `npm run test:coverage` (5 min) ✅

**Phase 1 Quick Wins: COMPLETED** ✅ (7/8 tasks done)
**Next: Start Phase 2 - Write component tests**

---

## 📚 Resources

- [Next.js Testing Docs](https://nextjs.org/docs/app/guides/testing)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Prisma Testing Guide](https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing)
- [Supabase Testing](https://supabase.com/docs/guides/local-development/testing/overview)

---

## 🆘 Getting Help

If you run into issues:

1. Check the error message carefully
2. Verify environment variables are loaded (`.env.test`)
3. Ensure test database is accessible
4. Check that mocks are properly configured
5. Review the testing documentation above
6. Ask Claude Code for help with specific errors

---

**Last Updated:** 2025-01-09 (Phase 1 Completed)
**Target Completion:** 4 weeks from start date
**Success Criteria:** 80%+ test coverage with passing CI/CD pipeline
**Current Status:** Phase 1 Foundation complete ✅ - Ready for Phase 2
