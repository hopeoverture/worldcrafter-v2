# WorldCrafter Testing Guide

This document provides detailed testing patterns and conventions for WorldCrafter features.

## Testing Philosophy

WorldCrafter uses a three-layer testing pyramid:

1. **Unit Tests (60-70%)** - Components, utilities, and pure functions
2. **Integration Tests (20-30%)** - Server Actions with real test database
3. **E2E Tests (10-20%)** - Complete user flows in browsers

**Coverage Goal**: 80%+ overall coverage (enforced by Vitest)

## Unit Testing Patterns

### Testing React Components

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/utils/render'
import FeatureComponent from '../FeatureComponent'

describe('FeatureComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<FeatureComponent />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeatureComponent />)

    const button = screen.getByRole('button', { name: /submit/i })
    await user.click(button)

    expect(screen.getByText(/success/i)).toBeInTheDocument()
  })

  it('displays error state', () => {
    renderWithProviders(<FeatureComponent error="Something went wrong" />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
```

### Testing Utilities and Pure Functions

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, calculateTotal } from '../utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('formats ISO date correctly', () => {
      expect(formatDate('2024-01-15')).toBe('January 15, 2024')
    })

    it('handles invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid date')
    })
  })

  describe('calculateTotal', () => {
    it('sums array of numbers', () => {
      expect(calculateTotal([10, 20, 30])).toBe(60)
    })

    it('returns 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0)
    })
  })
})
```

### Testing Forms

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/utils/render'
import FeatureForm from '../FeatureForm'

describe('FeatureForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FeatureForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/field is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderWithProviders(<FeatureForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User'
      })
    })
  })

  it('displays server errors', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    renderWithProviders(<FeatureForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })
})
```

### Using Test Data Factories

```typescript
import { describe, it, expect } from 'vitest'
import { createMockUser } from '@/test/factories/user'
import { renderWithProviders, screen } from '@/test/utils/render'
import UserProfile from '../UserProfile'

describe('UserProfile', () => {
  it('renders user information', () => {
    const user = createMockUser({
      email: 'john@example.com',
      name: 'John Doe'
    })

    renderWithProviders(<UserProfile user={user} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})
```

## Integration Testing Patterns

Integration tests verify Server Actions and database operations with a real test database.

### Basic Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/user'
import { submitUserForm } from '../actions'

describe('User Form Integration', () => {
  let testUserId: string

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } })
    }
  })

  it('creates user in database', async () => {
    const userData = createMockUser({
      email: 'test@example.com',
      name: 'Test User'
    })

    const result = await submitUserForm(userData)

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      email: 'test@example.com',
      name: 'Test User'
    })

    testUserId = result.data!.id

    // Verify in database
    const dbUser = await prisma.user.findUnique({
      where: { id: testUserId }
    })
    expect(dbUser).toBeTruthy()
    expect(dbUser?.email).toBe('test@example.com')
  })

  it('validates input data', async () => {
    const invalidData = { email: 'not-an-email', name: '' }

    const result = await submitUserForm(invalidData as any)

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('requires authentication', async () => {
    // Test without authentication context
    const result = await submitUserForm(createMockUser())

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })
})
```

### Testing with Database Seeding

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/user'

describe('User Operations', () => {
  let seedUserId: string

  beforeAll(async () => {
    // Seed test data
    const seedUser = await prisma.user.create({
      data: createMockUser({ email: 'seed@example.com' })
    })
    seedUserId = seedUser.id
  })

  afterAll(async () => {
    // Clean up all test data
    await prisma.user.deleteMany({
      where: {
        email: { in: ['seed@example.com', 'created@example.com'] }
      }
    })
  })

  it('fetches existing user', async () => {
    const user = await prisma.user.findUnique({
      where: { id: seedUserId }
    })

    expect(user).toBeTruthy()
    expect(user?.email).toBe('seed@example.com')
  })
})
```

### Testing RLS Policies

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/user'

describe('RLS Policies', () => {
  let userId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: createMockUser()
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } })
  })

  it('allows users to read own data', async () => {
    // This test requires auth context - may need mocking
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    expect(error).toBeNull()
    expect(data.id).toBe(userId)
  })

  it('prevents users from reading other users data', async () => {
    const supabase = await createClient()

    // Attempt to read different user's data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'different-user-id')
      .single()

    expect(data).toBeNull()
  })
})
```

## E2E Testing Patterns

E2E tests verify complete user workflows in real browsers using Playwright.

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test'

test('user can submit form', async ({ page }) => {
  await page.goto('/feature')

  // Fill form
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="name"]', 'Test User')

  // Submit
  await page.click('button[type="submit"]')

  // Verify success
  await expect(page.locator('text=Success')).toBeVisible()
})
```

### Using Page Object Model

```typescript
// e2e/pages/feature.page.ts
import { Page, Locator } from '@playwright/test'

export class FeaturePage {
  readonly page: Page
  readonly emailInput: Locator
  readonly nameInput: Locator
  readonly submitButton: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[name="email"]')
    this.nameInput = page.locator('input[name="name"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.successMessage = page.locator('text=Success')
  }

  async goto() {
    await this.page.goto('/feature')
  }

  async fillForm(email: string, name: string) {
    await this.emailInput.fill(email)
    await this.nameInput.fill(name)
  }

  async submit() {
    await this.submitButton.click()
  }

  async expectSuccess() {
    await this.successMessage.waitFor({ state: 'visible' })
  }
}

// e2e/feature.spec.ts
import { test, expect } from '@playwright/test'
import { FeaturePage } from './pages/feature.page'

test('user can submit form', async ({ page }) => {
  const featurePage = new FeaturePage(page)

  await featurePage.goto()
  await featurePage.fillForm('test@example.com', 'Test User')
  await featurePage.submit()
  await featurePage.expectSuccess()
})
```

### Testing Authentication Flows

```typescript
import { test, expect } from '@playwright/test'

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/protected')

  // Should redirect to login
  await expect(page).toHaveURL('/login')
})

test('authenticated user can access protected route', async ({ page }) => {
  // Login first
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // Navigate to protected route
  await page.goto('/protected')

  // Should see protected content
  await expect(page.locator('h1')).toContainText('Protected Content')
})
```

### Testing Multi-Step Flows

```typescript
import { test, expect } from '@playwright/test'

test('complete user registration flow', async ({ page }) => {
  // Step 1: Navigate to signup
  await page.goto('/signup')

  // Step 2: Fill registration form
  await page.fill('input[name="email"]', 'newuser@example.com')
  await page.fill('input[name="password"]', 'SecurePass123!')
  await page.fill('input[name="confirmPassword"]', 'SecurePass123!')
  await page.click('button[type="submit"]')

  // Step 3: Verify email confirmation page
  await expect(page.locator('h1')).toContainText('Check your email')

  // Step 4: Complete profile (simulated)
  await page.goto('/profile/complete')
  await page.fill('input[name="name"]', 'New User')
  await page.click('button[type="submit"]')

  // Step 5: Verify dashboard access
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('text=Welcome, New User')).toBeVisible()
})
```

### Testing Across Devices

```typescript
import { test, expect, devices } from '@playwright/test'

test.describe('responsive design', () => {
  test('displays mobile navigation', async ({ page }) => {
    await page.setViewportSize(devices['iPhone 13'].viewport)
    await page.goto('/')

    // Mobile menu should be visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible()

    // Desktop navigation should be hidden
    await expect(page.locator('nav.desktop')).not.toBeVisible()
  })

  test('displays desktop navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    // Desktop navigation should be visible
    await expect(page.locator('nav.desktop')).toBeVisible()

    // Mobile menu should be hidden
    await expect(page.locator('[aria-label="Menu"]')).not.toBeVisible()
  })
})
```

## Test Organization

### File Naming Conventions

- Unit tests: `ComponentName.test.tsx` or `utils.test.ts`
- Integration tests: `feature-name.integration.test.ts`
- E2E tests: `feature-name.spec.ts`

### Directory Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── __tests__/
│   │       └── Button.test.tsx
│   └── FeatureComponent.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── app/
    ├── feature/
    │   ├── page.tsx
    │   └── actions.ts
    └── __tests__/
        └── feature.integration.test.ts

e2e/
├── pages/
│   └── feature.page.ts
└── feature.spec.ts
```

## Testing Checklist

For each feature, ensure:

- [ ] Unit tests for all components
- [ ] Unit tests for utility functions
- [ ] Integration tests for Server Actions
- [ ] Integration tests for database operations
- [ ] E2E tests for critical user flows
- [ ] Test authentication requirements
- [ ] Test authorization checks
- [ ] Test validation logic
- [ ] Test error handling
- [ ] Test loading states
- [ ] Coverage meets 80% threshold
- [ ] All tests pass before committing

## Running Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (run once)
npm test -- --run

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui

# Related tests (pre-commit)
vitest related --run

# E2E tests
npm run test:e2e

# E2E UI mode
npm run test:e2e:ui

# All tests
npm run test:all
```

## Common Testing Utilities

### Query Priority

1. **getByRole** - Preferred (accessibility-based)
   ```typescript
   screen.getByRole('button', { name: /submit/i })
   ```

2. **getByLabelText** - Form elements
   ```typescript
   screen.getByLabelText(/email/i)
   ```

3. **getByText** - Static content
   ```typescript
   screen.getByText(/welcome/i)
   ```

4. **getByTestId** - Last resort
   ```typescript
   screen.getByTestId('custom-component')
   ```

### Async Testing

```typescript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react'

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
})

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i))

// With custom timeout
await waitFor(() => {
  expect(screen.getByText(/data/i)).toBeInTheDocument()
}, { timeout: 5000 })
```

### User Events

```typescript
import { userEvent } from '@testing-library/user-event'

const user = userEvent.setup()

// Type
await user.type(input, 'Hello')

// Click
await user.click(button)

// Select
await user.selectOptions(select, 'option1')

// Upload file
await user.upload(fileInput, file)

// Keyboard
await user.keyboard('{Enter}')
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state or methods

2. **Write Independent Tests**
   - Each test should be isolated
   - Don't rely on test execution order

3. **Use Descriptive Test Names**
   - Describe what is being tested
   - Include expected behavior

4. **Clean Up After Tests**
   - Use `afterEach`/`afterAll` hooks
   - Delete test database records

5. **Mock External Dependencies**
   - Mock API calls in unit tests
   - Use test database for integration tests

6. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Validation failures
   - Unauthorized access

7. **Maintain Test Performance**
   - Keep unit tests fast (<100ms)
   - Minimize database operations
   - Use parallelization when possible
