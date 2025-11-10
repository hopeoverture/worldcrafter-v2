# Testing Patterns for WorldCrafter

Comprehensive testing patterns for unit tests, integration tests, and E2E tests in WorldCrafter.

## Unit Testing Patterns

### Component Testing

#### Basic Component Rendering

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/render'
import Button from '../Button'

describe('Button', () => {
  it('renders with text', () => {
    renderWithProviders(<Button>Click me</Button>)

    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('renders with variant', () => {
    renderWithProviders(<Button variant="destructive">Delete</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('destructive')
  })

  it('is disabled when disabled prop is true', () => {
    renderWithProviders(<Button disabled>Click me</Button>)

    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

#### User Interactions

```typescript
import { userEvent } from '@testing-library/user-event'

describe('Button interactions', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    renderWithProviders(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    renderWithProviders(<Button onClick={handleClick} disabled>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

#### Form Component Testing

```typescript
import { waitFor } from '@testing-library/react'

describe('UserForm', () => {
  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<UserForm />)

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderWithProviders(<UserForm onSubmit={onSubmit} />)

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Verify submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      })
    })
  })

  it('displays server errors', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))

    renderWithProviders(<UserForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'John')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('disables submit during submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    renderWithProviders(<UserForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/name/i), 'John')
    const submitButton = screen.getByRole('button', { name: /submit/i })

    await user.click(submitButton)

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })
})
```

#### Component with State

```typescript
describe('Counter', () => {
  it('increments count', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)

    const button = screen.getByRole('button', { name: /increment/i })
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument()

    await user.click(button)
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument()

    await user.click(button)
    expect(screen.getByText(/count: 2/i)).toBeInTheDocument()
  })
})
```

#### Component with Props

```typescript
describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  }

  it('displays user information', () => {
    renderWithProviders(<UserProfile user={mockUser} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('displays placeholder when no avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatarUrl: null }

    renderWithProviders(<UserProfile user={userWithoutAvatar} />)

    expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument()
  })
})
```

### Utility Function Testing

```typescript
describe('formatDate', () => {
  it('formats ISO date to readable format', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024')
  })

  it('handles invalid dates', () => {
    expect(formatDate('invalid')).toBe('Invalid date')
  })

  it('handles null', () => {
    expect(formatDate(null)).toBe('-')
  })
})

describe('calculateTotal', () => {
  it('sums array of numbers', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60)
  })

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('handles decimals correctly', () => {
    expect(calculateTotal([1.5, 2.5, 3])).toBe(7)
  })
})
```

## Integration Testing Patterns

### Server Action Testing

#### Basic CRUD Operations

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createPost, updatePost, deletePost } from '../actions'

describe('Post Actions Integration Tests', () => {
  const createdIds: string[] = []

  afterAll(async () => {
    // Cleanup
    await prisma.post.deleteMany({
      where: { id: { in: createdIds } }
    })
  })

  describe('createPost', () => {
    it('creates post in database', async () => {
      const result = await createPost({
        title: 'Test Post',
        content: 'Test content'
      })

      expect(result.success).toBe(true)
      expect(result.data).toMatchObject({
        title: 'Test Post',
        content: 'Test content'
      })

      createdIds.push(result.data!.id)

      // Verify in database
      const dbPost = await prisma.post.findUnique({
        where: { id: result.data!.id }
      })

      expect(dbPost).toBeTruthy()
      expect(dbPost?.title).toBe('Test Post')
    })

    it('validates required fields', async () => {
      const result = await createPost({
        title: '',
        content: 'Content'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('updatePost', () => {
    let postId: string

    beforeAll(async () => {
      const post = await prisma.post.create({
        data: { title: 'Original', content: 'Original content' }
      })
      postId = post.id
      createdIds.push(postId)
    })

    it('updates existing post', async () => {
      const result = await updatePost(postId, {
        title: 'Updated Title'
      })

      expect(result.success).toBe(true)

      const dbPost = await prisma.post.findUnique({
        where: { id: postId }
      })

      expect(dbPost?.title).toBe('Updated Title')
    })

    it('returns error for non-existent post', async () => {
      const result = await updatePost('non-existent-id', {
        title: 'Test'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('deletePost', () => {
    it('deletes existing post', async () => {
      const post = await prisma.post.create({
        data: { title: 'To Delete', content: 'Content' }
      })

      const result = await deletePost(post.id)

      expect(result.success).toBe(true)

      const dbPost = await prisma.post.findUnique({
        where: { id: post.id }
      })

      expect(dbPost).toBeNull()
    })
  })
})
```

#### Testing with Authentication

```typescript
describe('Authenticated Actions', () => {
  let userId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } })
  })

  it('requires authentication', async () => {
    // Without auth context
    const result = await createPost({
      title: 'Test',
      content: 'Content'
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  it('prevents unauthorized updates', async () => {
    // Create post as user1
    const post = await prisma.post.create({
      data: {
        title: 'User 1 Post',
        authorId: userId
      }
    })

    // Try to update as user2 (should fail)
    const result = await updatePost(post.id, { title: 'Hacked' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Forbidden')
  })
})
```

#### Testing RLS Policies

```typescript
describe('RLS Policy Tests', () => {
  it('allows users to read own data', async () => {
    // This requires mocking Supabase auth context
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', currentUserId)

    expect(error).toBeNull()
    expect(data).toBeTruthy()
  })

  it('prevents reading other users data', async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', 'different-user-id')

    expect(data).toEqual([]) // RLS filtered it out
  })
})
```

## E2E Testing Patterns

### Page Object Model

```typescript
// e2e/pages/login.page.ts
import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[name="email"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[role="alert"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectError(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' })
    await expect(this.errorMessage).toContainText(message)
  }
}
```

### Basic E2E Tests

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'

test.describe('Login Flow', () => {
  test('user can login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.login('user@example.com', 'password123')

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('shows error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.login('wrong@example.com', 'wrongpass')

    await loginPage.expectError('Invalid credentials')
  })
})
```

### Form Submission E2E

```typescript
test('complete form submission flow', async ({ page }) => {
  await page.goto('/posts/new')

  // Fill form
  await page.fill('input[name="title"]', 'My First Post')
  await page.fill('textarea[name="content"]', 'This is the content')
  await page.check('input[name="published"]')

  // Submit
  await page.click('button[type="submit"]')

  // Wait for redirect
  await page.waitForURL(/\/posts\/.*/)

  // Verify created post is displayed
  await expect(page.locator('h1')).toContainText('My First Post')
  await expect(page.locator('[data-testid="post-content"]')).toContainText('This is the content')
})
```

### Multi-Step Flow

```typescript
test('complete checkout flow', async ({ page }) => {
  // Step 1: Add items to cart
  await page.goto('/products')
  await page.click('[data-product="1"] button:has-text("Add to Cart")')
  await page.click('[data-product="2"] button:has-text("Add to Cart")')

  // Step 2: Go to cart
  await page.click('[aria-label="Cart"]')
  await expect(page).toHaveURL('/cart')
  await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2)

  // Step 3: Proceed to checkout
  await page.click('button:has-text("Checkout")')
  await expect(page).toHaveURL('/checkout')

  // Step 4: Fill shipping information
  await page.fill('input[name="address"]', '123 Main St')
  await page.fill('input[name="city"]', 'San Francisco')
  await page.fill('input[name="zip"]', '94105')

  // Step 5: Fill payment information
  await page.fill('input[name="cardNumber"]', '4242424242424242')
  await page.fill('input[name="expiry"]', '12/25')
  await page.fill('input[name="cvc"]', '123')

  // Step 6: Submit order
  await page.click('button:has-text("Place Order")')

  // Step 7: Verify success
  await page.waitForURL('/orders/*')
  await expect(page.locator('h1')).toContainText('Order Confirmed')
})
```

### Testing Responsiveness

```typescript
import { devices } from '@playwright/test'

test.describe('Mobile View', () => {
  test.use({ ...devices['iPhone 13'] })

  test('displays mobile navigation', async ({ page }) => {
    await page.goto('/')

    // Mobile menu button should be visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible()

    // Desktop nav should be hidden
    await expect(page.locator('nav.desktop')).not.toBeVisible()
  })
})
```

### Authentication Flow E2E

```typescript
test.describe('Protected Routes', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/login')
  })

  test('allows access when authenticated', async ({ page, context }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL('/dashboard')

    // Now can access protected route
    await page.goto('/settings')
    await expect(page.locator('h1')).toContainText('Settings')
  })
})
```

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { /* ... */ })

// ✅ Good
it('displays validation error when email is invalid', () => { /* ... */ })
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('increments counter when button clicked', async () => {
  // Arrange
  const user = userEvent.setup()
  renderWithProviders(<Counter />)

  // Act
  await user.click(screen.getByRole('button', { name: /increment/i }))

  // Assert
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument()
})
```

### 3. Test User Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation
expect(component.state.isOpen).toBe(true)

// ✅ Good: Testing user-visible behavior
expect(screen.getByRole('dialog')).toBeVisible()
```

### 4. Keep Tests Independent

```typescript
// ❌ Bad: Tests depend on each other
let sharedData: any

it('creates data', () => {
  sharedData = createData()
})

it('uses data', () => {
  expect(sharedData).toBeTruthy() // Fails if run alone
})

// ✅ Good: Each test is independent
it('creates and uses data', () => {
  const data = createData()
  expect(data).toBeTruthy()
})
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  vi.clearAllMocks()
})

afterAll(async () => {
  await prisma.post.deleteMany({
    where: { id: { in: createdIds } }
  })
})
```

### 6. Use Test Factories

```typescript
// ❌ Bad: Repeating test data
const user1 = { id: '1', name: 'John', email: 'john@example.com' }
const user2 = { id: '2', name: 'Jane', email: 'jane@example.com' }

// ✅ Good: Use factory
const user1 = createMockUser({ name: 'John' })
const user2 = createMockUser({ name: 'Jane' })
```

### 7. Test Edge Cases

```typescript
describe('divide', () => {
  it('divides two numbers', () => {
    expect(divide(10, 2)).toBe(5)
  })

  it('handles division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero')
  })

  it('handles negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5)
  })

  it('handles decimals', () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 2)
  })
})
```

## AI Feature Testing Patterns

### Mocking OpenAI/Anthropic APIs

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateStory } from '../ai/story-generator'

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn()
}))

describe('AI Story Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates story from prompt', async () => {
    const mockResponse = {
      text: 'Once upon a time in a magical kingdom...',
      usage: { totalTokens: 150 }
    }

    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue(mockResponse)

    const result = await generateStory({
      prompt: 'A fantasy adventure',
      tone: 'epic'
    })

    expect(result.story).toBe(mockResponse.text)
    expect(generateText).toHaveBeenCalledWith({
      model: expect.any(Object),
      prompt: expect.stringContaining('fantasy adventure')
    })
  })

  it('handles API errors gracefully', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockRejectedValue(
      new Error('API rate limit exceeded')
    )

    await expect(
      generateStory({ prompt: 'Test' })
    ).rejects.toThrow('Failed to generate story')
  })

  it('retries on transient failures', async () => {
    const { generateText } = await import('ai')

    // Fail twice, then succeed
    vi.mocked(generateText)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValue({ text: 'Success story', usage: { totalTokens: 100 } })

    const result = await generateStory(
      { prompt: 'Test' },
      { maxRetries: 3 }
    )

    expect(result.story).toBe('Success story')
    expect(generateText).toHaveBeenCalledTimes(3)
  })
})
```

### Testing AI Response Parsing and Validation

```typescript
describe('AI Response Validation', () => {
  it('validates response structure', async () => {
    const mockResponse = {
      text: JSON.stringify({
        title: 'The Quest',
        chapters: [
          { number: 1, content: 'Chapter 1 content' },
          { number: 2, content: 'Chapter 2 content' }
        ]
      }),
      usage: { totalTokens: 200 }
    }

    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue(mockResponse)

    const result = await generateStructuredStory({ prompt: 'Adventure' })

    expect(result).toMatchObject({
      title: expect.any(String),
      chapters: expect.arrayContaining([
        expect.objectContaining({
          number: expect.any(Number),
          content: expect.any(String)
        })
      ])
    })
  })

  it('handles malformed JSON responses', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: 'Invalid JSON {not valid}',
      usage: { totalTokens: 50 }
    })

    await expect(
      generateStructuredStory({ prompt: 'Test' })
    ).rejects.toThrow('Failed to parse AI response')
  })

  it('validates required fields', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({ title: 'Story' }), // Missing chapters
      usage: { totalTokens: 30 }
    })

    await expect(
      generateStructuredStory({ prompt: 'Test' })
    ).rejects.toThrow('Missing required field: chapters')
  })
})
```

### Testing Rate Limiting

```typescript
describe('AI Rate Limiting', () => {
  it('enforces rate limits', async () => {
    const rateLimiter = createRateLimiter({
      maxRequests: 10,
      windowMs: 60000
    })

    // Make 10 requests (should succeed)
    for (let i = 0; i < 10; i++) {
      await expect(rateLimiter.check('user-123')).resolves.toBe(true)
    }

    // 11th request should fail
    await expect(rateLimiter.check('user-123')).resolves.toBe(false)
  })

  it('resets after time window', async () => {
    vi.useFakeTimers()

    const rateLimiter = createRateLimiter({
      maxRequests: 5,
      windowMs: 60000
    })

    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.check('user-123')
    }

    // Should be blocked
    expect(await rateLimiter.check('user-123')).toBe(false)

    // Fast-forward past window
    vi.advanceTimersByTime(61000)

    // Should work again
    expect(await rateLimiter.check('user-123')).toBe(true)

    vi.useRealTimers()
  })
})
```

### Snapshot Testing for AI-Generated Content

```typescript
describe('AI Content Snapshots', () => {
  it('matches expected story structure', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: 'A hero embarks on a journey...',
      usage: { totalTokens: 100 }
    })

    const result = await generateStory({ prompt: 'Hero journey' })

    expect(result).toMatchSnapshot()
  })

  it('generates consistent character profiles', async () => {
    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: JSON.stringify({
        name: 'Aria',
        class: 'Mage',
        stats: { strength: 5, intelligence: 18 }
      }),
      usage: { totalTokens: 50 }
    })

    const character = await generateCharacter({ archetype: 'mage' })

    expect(character).toMatchSnapshot({
      stats: {
        strength: expect.any(Number),
        intelligence: expect.any(Number)
      }
    })
  })
})
```

### Testing Streaming Responses (SSE)

```typescript
describe('AI Streaming Responses', () => {
  it('handles streamed text generation', async () => {
    const chunks: string[] = []
    const mockStream = {
      textStream: (async function* () {
        yield 'Once '
        yield 'upon '
        yield 'a time...'
      })()
    }

    const { streamText } = await import('ai')
    vi.mocked(streamText).mockResolvedValue(mockStream as any)

    const stream = await streamStory({ prompt: 'Fairy tale' })

    for await (const chunk of stream.textStream) {
      chunks.push(chunk)
    }

    expect(chunks).toEqual(['Once ', 'upon ', 'a time...'])
  })

  it('handles stream errors', async () => {
    const mockStream = {
      textStream: (async function* () {
        yield 'Start'
        throw new Error('Stream interrupted')
      })()
    }

    const { streamText } = await import('ai')
    vi.mocked(streamText).mockResolvedValue(mockStream as any)

    const stream = await streamStory({ prompt: 'Test' })
    const chunks: string[] = []

    await expect(async () => {
      for await (const chunk of stream.textStream) {
        chunks.push(chunk)
      }
    }).rejects.toThrow('Stream interrupted')

    expect(chunks).toEqual(['Start'])
  })
})
```

### Testing Cost Tracking

```typescript
describe('AI Cost Tracking', () => {
  it('tracks token usage', async () => {
    const costTracker = createCostTracker()

    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: 'Story content',
      usage: {
        promptTokens: 50,
        completionTokens: 100,
        totalTokens: 150
      }
    })

    await generateStory({ prompt: 'Test' }, { costTracker })

    const stats = costTracker.getStats()
    expect(stats.totalTokens).toBe(150)
    expect(stats.promptTokens).toBe(50)
    expect(stats.completionTokens).toBe(100)
  })

  it('calculates cost correctly', async () => {
    const costTracker = createCostTracker({
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03
    })

    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: 'Content',
      usage: {
        promptTokens: 1000,
        completionTokens: 2000,
        totalTokens: 3000
      }
    })

    await generateStory({ prompt: 'Test' }, { costTracker })

    const cost = costTracker.getTotalCost()
    // (1000 * 0.01/1000) + (2000 * 0.03/1000) = 0.01 + 0.06 = 0.07
    expect(cost).toBeCloseTo(0.07, 2)
  })

  it('enforces budget limits', async () => {
    const costTracker = createCostTracker({
      maxBudget: 0.10,
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03
    })

    const { generateText } = await import('ai')
    vi.mocked(generateText).mockResolvedValue({
      text: 'Content',
      usage: {
        promptTokens: 5000,
        completionTokens: 5000,
        totalTokens: 10000
      }
    })

    // First call should work
    await generateStory({ prompt: 'Test 1' }, { costTracker })

    // Second call should exceed budget
    await expect(
      generateStory({ prompt: 'Test 2' }, { costTracker })
    ).rejects.toThrow('Budget limit exceeded')
  })
})
```

## Visualization Testing Patterns

### Testing Canvas/SVG Rendering with Playwright

```typescript
import { test, expect } from '@playwright/test'

test.describe('Timeline Visualization', () => {
  test('renders timeline canvas', async ({ page }) => {
    await page.goto('/world/timeline')

    // Wait for canvas to be rendered
    const canvas = page.locator('canvas[data-timeline]')
    await expect(canvas).toBeVisible()

    // Verify canvas dimensions
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(800)
    expect(box?.height).toBeGreaterThan(400)
  })

  test('renders timeline events', async ({ page }) => {
    await page.goto('/world/timeline')

    // Take screenshot for visual comparison
    const timeline = page.locator('[data-testid="timeline-container"]')
    await expect(timeline).toHaveScreenshot('timeline-events.png', {
      maxDiffPixels: 100
    })
  })

  test('renders event markers at correct positions', async ({ page }) => {
    await page.goto('/world/timeline')

    // Check SVG elements are rendered
    const events = page.locator('svg circle.event-marker')
    await expect(events).toHaveCount(5)

    // Verify first event position
    const firstEvent = events.first()
    const cx = await firstEvent.getAttribute('cx')
    const cy = await firstEvent.getAttribute('cy')

    expect(Number(cx)).toBeGreaterThan(0)
    expect(Number(cy)).toBeGreaterThan(0)
  })
})
```

### Testing Interactive Charts (Pan, Zoom, Drag)

```typescript
test.describe('Interactive Graph', () => {
  test('pans graph on drag', async ({ page }) => {
    await page.goto('/world/relationship-graph')

    const canvas = page.locator('canvas[data-graph]')
    const initialScreenshot = await canvas.screenshot()

    // Drag to pan
    await canvas.hover()
    await page.mouse.down()
    await page.mouse.move(100, 100)
    await page.mouse.up()

    // Wait for animation
    await page.waitForTimeout(500)

    const afterScreenshot = await canvas.screenshot()

    // Verify viewport changed
    expect(initialScreenshot).not.toEqual(afterScreenshot)
  })

  test('zooms on scroll', async ({ page }) => {
    await page.goto('/world/relationship-graph')

    // Get initial scale
    const initialScale = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph]') as any
      return canvas?.dataset.scale || '1'
    })

    const canvas = page.locator('canvas[data-graph]')

    // Zoom in
    await canvas.hover()
    await page.mouse.wheel(0, -100)
    await page.waitForTimeout(300)

    const newScale = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph]') as any
      return canvas?.dataset.scale || '1'
    })

    expect(Number(newScale)).toBeGreaterThan(Number(initialScale))
  })

  test('selects nodes on click', async ({ page }) => {
    await page.goto('/world/relationship-graph')

    // Click on node
    const canvas = page.locator('canvas[data-graph]')
    await canvas.click({ position: { x: 200, y: 200 } })

    // Verify node details panel appears
    await expect(page.locator('[data-testid="node-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="node-name"]')).toContainText(/\w+/)
  })
})
```

### Testing Graph Layout Algorithms

```typescript
describe('Graph Layout Algorithm', () => {
  it('calculates force-directed layout', () => {
    const nodes = [
      { id: '1', label: 'Character A' },
      { id: '2', label: 'Character B' },
      { id: '3', label: 'Character C' }
    ]

    const edges = [
      { from: '1', to: '2', type: 'friend' },
      { from: '2', to: '3', type: 'enemy' }
    ]

    const layout = calculateForceLayout(nodes, edges, {
      width: 800,
      height: 600
    })

    // Verify all nodes have positions
    expect(layout.nodes).toHaveLength(3)
    layout.nodes.forEach(node => {
      expect(node.x).toBeGreaterThanOrEqual(0)
      expect(node.x).toBeLessThanOrEqual(800)
      expect(node.y).toBeGreaterThanOrEqual(0)
      expect(node.y).toBeLessThanOrEqual(600)
    })
  })

  it('prevents node overlap', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      label: `Node ${i}`
    }))

    const layout = calculateForceLayout(nodes, [], {
      width: 800,
      height: 600,
      nodeRadius: 30
    })

    // Check for overlaps
    for (let i = 0; i < layout.nodes.length; i++) {
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const node1 = layout.nodes[i]
        const node2 = layout.nodes[j]

        const distance = Math.sqrt(
          Math.pow(node2.x - node1.x, 2) +
          Math.pow(node2.y - node1.y, 2)
        )

        // Minimum distance should be 2 * radius
        expect(distance).toBeGreaterThanOrEqual(60)
      }
    }
  })
})
```

### Testing Timeline Filtering

```typescript
test.describe('Timeline Filtering', () => {
  test('filters events by date range', async ({ page }) => {
    await page.goto('/world/timeline')

    // Set date range
    await page.fill('input[name="startDate"]', '1000-01-01')
    await page.fill('input[name="endDate"]', '1500-12-31')
    await page.click('button:has-text("Apply Filter")')

    // Wait for render
    await page.waitForTimeout(500)

    // Check filtered results
    const events = page.locator('.timeline-event')
    await expect(events).toHaveCount(3)

    // Verify all events are in range
    const eventDates = await events.evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-date'))
    )

    eventDates.forEach(date => {
      const eventDate = new Date(date!)
      expect(eventDate >= new Date('1000-01-01')).toBe(true)
      expect(eventDate <= new Date('1500-12-31')).toBe(true)
    })
  })

  test('filters events by category', async ({ page }) => {
    await page.goto('/world/timeline')

    // Select category
    await page.selectOption('select[name="category"]', 'battle')
    await page.waitForTimeout(500)

    const events = page.locator('.timeline-event')
    await expect(events).toHaveCount(2)

    // Verify all are battles
    const categories = await events.evaluateAll(elements =>
      elements.map(el => el.getAttribute('data-category'))
    )

    categories.forEach(category => {
      expect(category).toBe('battle')
    })
  })
})
```

### Testing Map Marker Placement

```typescript
test.describe('World Map', () => {
  test('places markers at correct coordinates', async ({ page }) => {
    await page.goto('/world/map')

    // Wait for map to load
    await page.waitForSelector('[data-testid="map-container"]')

    // Verify markers are placed
    const markers = page.locator('.map-marker')
    await expect(markers).toHaveCount(5)

    // Check first marker position
    const firstMarker = markers.first()
    const position = await firstMarker.evaluate(el => ({
      left: el.style.left,
      top: el.style.top
    }))

    expect(position.left).toMatch(/\d+%/)
    expect(position.top).toMatch(/\d+%/)
  })

  test('shows location details on marker click', async ({ page }) => {
    await page.goto('/world/map')

    // Click marker
    await page.click('.map-marker:first-child')

    // Verify popup
    const popup = page.locator('[data-testid="location-popup"]')
    await expect(popup).toBeVisible()
    await expect(popup.locator('h3')).toContainText(/\w+/)
  })

  test('highlights connected locations', async ({ page }) => {
    await page.goto('/world/map')

    // Hover over marker
    await page.hover('.map-marker[data-location="capital"]')

    // Verify connections are highlighted
    const connections = page.locator('.map-connection.highlighted')
    await expect(connections).toHaveCount(3)
  })
})
```

### Visual Regression Testing

```typescript
test.describe('Visual Regression', () => {
  test('timeline matches baseline', async ({ page }) => {
    await page.goto('/world/timeline')
    await page.waitForSelector('canvas[data-timeline]')

    // Take full page screenshot
    await expect(page).toHaveScreenshot('timeline-full.png', {
      fullPage: true,
      maxDiffPixels: 100
    })
  })

  test('graph matches baseline', async ({ page }) => {
    await page.goto('/world/relationship-graph')
    await page.waitForSelector('canvas[data-graph]')

    // Wait for animation to settle
    await page.waitForTimeout(1000)

    const canvas = page.locator('canvas[data-graph]')
    await expect(canvas).toHaveScreenshot('relationship-graph.png', {
      maxDiffPixelRatio: 0.01
    })
  })

  test('map matches baseline on different viewports', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/world/map')
    await expect(page).toHaveScreenshot('map-desktop.png')

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/world/map')
    await expect(page).toHaveScreenshot('map-tablet.png')

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/world/map')
    await expect(page).toHaveScreenshot('map-mobile.png')
  })
})
```

## Real-time Collaboration Testing Patterns

### Mocking WebSocket/SSE Connections

```typescript
describe('WebSocket Collaboration', () => {
  let mockWs: any

  beforeEach(() => {
    mockWs = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

    global.WebSocket = vi.fn(() => mockWs) as any
  })

  it('connects to collaboration server', () => {
    const collab = createCollaborationClient({
      worldId: 'world-123',
      userId: 'user-456'
    })

    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('ws://'),
      expect.any(Array)
    )
  })

  it('sends presence updates', () => {
    const collab = createCollaborationClient({
      worldId: 'world-123',
      userId: 'user-456'
    })

    collab.updatePresence({
      viewing: 'character-789',
      cursor: { x: 100, y: 200 }
    })

    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'presence',
        payload: {
          viewing: 'character-789',
          cursor: { x: 100, y: 200 }
        }
      })
    )
  })

  it('receives remote updates', () => {
    const collab = createCollaborationClient({
      worldId: 'world-123',
      userId: 'user-456'
    })

    const onUpdate = vi.fn()
    collab.on('remoteUpdate', onUpdate)

    // Simulate receiving message
    const messageHandler = mockWs.addEventListener.mock.calls.find(
      ([event]) => event === 'message'
    )?.[1]

    messageHandler({
      data: JSON.stringify({
        type: 'update',
        userId: 'user-789',
        payload: {
          entityId: 'character-123',
          field: 'name',
          value: 'Updated Name'
        }
      })
    })

    expect(onUpdate).toHaveBeenCalledWith({
      userId: 'user-789',
      entityId: 'character-123',
      field: 'name',
      value: 'Updated Name'
    })
  })

  it('handles connection loss and reconnection', async () => {
    vi.useFakeTimers()
    const collab = createCollaborationClient({
      worldId: 'world-123',
      userId: 'user-456'
    })

    // Simulate connection close
    const closeHandler = mockWs.addEventListener.mock.calls.find(
      ([event]) => event === 'close'
    )?.[1]

    closeHandler({ code: 1006 })

    // Should attempt reconnect after delay
    vi.advanceTimersByTime(5000)

    expect(global.WebSocket).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })
})
```

### Testing Presence Indicators

```typescript
test.describe('Collaborative Editing - Presence', () => {
  test('shows other users viewing same entity', async ({ page, context }) => {
    // Open first user session
    await page.goto('/world/characters/char-123')

    // Open second user session in new page
    const page2 = await context.newPage()
    await page2.goto('/world/characters/char-123')

    // Verify presence indicator appears on first page
    await expect(page.locator('[data-testid="presence-indicator"]'))
      .toHaveCount(1)

    await expect(page.locator('[data-testid="presence-indicator"]'))
      .toContainText('User 2')
  })

  test('shows cursor positions of other users', async ({ page }) => {
    await page.goto('/world/characters/char-123')

    // Simulate remote cursor update
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('remoteCursor', {
        detail: {
          userId: 'user-789',
          x: 250,
          y: 350,
          userName: 'Alice'
        }
      }))
    })

    // Verify cursor appears
    const cursor = page.locator('[data-cursor="user-789"]')
    await expect(cursor).toBeVisible()

    const position = await cursor.boundingBox()
    expect(position?.x).toBeCloseTo(250, 10)
    expect(position?.y).toBeCloseTo(350, 10)
  })

  test('removes presence when user leaves', async ({ page, context }) => {
    await page.goto('/world/characters/char-123')

    const page2 = await context.newPage()
    await page2.goto('/world/characters/char-123')

    // Verify presence appears
    await expect(page.locator('[data-testid="presence-indicator"]'))
      .toHaveCount(1)

    // Close second page
    await page2.close()
    await page.waitForTimeout(1000)

    // Verify presence removed
    await expect(page.locator('[data-testid="presence-indicator"]'))
      .toHaveCount(0)
  })
})
```

### Testing Optimistic UI Updates

```typescript
describe('Optimistic Updates', () => {
  it('updates UI immediately before server confirms', async () => {
    const mockUpdate = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )

    renderWithProviders(
      <CharacterEditor characterId="char-123" onUpdate={mockUpdate} />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText(/name/i)

    // Type new name
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')

    // UI should update immediately
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument()

    // Server call should be pending
    expect(mockUpdate).toHaveBeenCalledWith({
      field: 'name',
      value: 'New Name'
    })
  })

  it('reverts on server error', async () => {
    const mockUpdate = vi.fn().mockRejectedValue(new Error('Server error'))

    renderWithProviders(
      <CharacterEditor
        characterId="char-123"
        onUpdate={mockUpdate}
        initialName="Original Name"
      />
    )

    const user = userEvent.setup()
    const nameInput = screen.getByLabelText(/name/i)

    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/failed to update/i)).toBeInTheDocument()
    })

    // Should revert to original
    expect(nameInput).toHaveValue('Original Name')
  })
})
```

### Testing Conflict Resolution

```typescript
describe('Conflict Resolution', () => {
  it('resolves conflicts using last-write-wins', async () => {
    const resolver = createConflictResolver({ strategy: 'last-write-wins' })

    const localUpdate = {
      entityId: 'char-123',
      field: 'name',
      value: 'Local Name',
      timestamp: new Date('2024-01-15T10:00:00Z')
    }

    const remoteUpdate = {
      entityId: 'char-123',
      field: 'name',
      value: 'Remote Name',
      timestamp: new Date('2024-01-15T10:00:01Z')
    }

    const resolved = resolver.resolve(localUpdate, remoteUpdate)

    expect(resolved.value).toBe('Remote Name') // Remote is newer
  })

  it('merges non-conflicting fields', async () => {
    const resolver = createConflictResolver({ strategy: 'merge' })

    const localUpdates = {
      entityId: 'char-123',
      updates: {
        name: 'Local Name',
        age: 25
      },
      timestamp: new Date('2024-01-15T10:00:00Z')
    }

    const remoteUpdates = {
      entityId: 'char-123',
      updates: {
        class: 'Warrior',
        level: 5
      },
      timestamp: new Date('2024-01-15T10:00:01Z')
    }

    const resolved = resolver.merge(localUpdates, remoteUpdates)

    expect(resolved.updates).toEqual({
      name: 'Local Name',
      age: 25,
      class: 'Warrior',
      level: 5
    })
  })

  it('detects conflicting updates', () => {
    const detector = createConflictDetector()

    const update1 = {
      entityId: 'char-123',
      field: 'name',
      value: 'Name A',
      version: 1
    }

    const update2 = {
      entityId: 'char-123',
      field: 'name',
      value: 'Name B',
      version: 1 // Same version = conflict
    }

    expect(detector.hasConflict(update1, update2)).toBe(true)
  })
})
```

### Testing Concurrent Edits

```typescript
test.describe('Concurrent Editing', () => {
  test('handles simultaneous edits to different fields', async ({ page, context }) => {
    // User 1 edits name
    await page.goto('/world/characters/char-123')
    await page.fill('input[name="name"]', 'Updated Name')

    // User 2 edits age
    const page2 = await context.newPage()
    await page2.goto('/world/characters/char-123')
    await page2.fill('input[name="age"]', '30')

    // Both save
    await Promise.all([
      page.click('button:has-text("Save")'),
      page2.click('button:has-text("Save")')
    ])

    // Wait for sync
    await page.waitForTimeout(1000)

    // Reload to verify both changes persisted
    await page.reload()
    expect(await page.inputValue('input[name="name"]')).toBe('Updated Name')
    expect(await page.inputValue('input[name="age"]')).toBe('30')
  })

  test('shows conflict notification for same field', async ({ page, context }) => {
    await page.goto('/world/characters/char-123')

    const page2 = await context.newPage()
    await page2.goto('/world/characters/char-123')

    // Both edit same field
    await page.fill('input[name="name"]', 'Name from User 1')
    await page2.fill('input[name="name"]', 'Name from User 2')

    // User 2 saves first
    await page2.click('button:has-text("Save")')
    await page2.waitForTimeout(500)

    // User 1 saves second
    await page.click('button:has-text("Save")')

    // Should show conflict warning
    await expect(page.locator('[role="alert"]'))
      .toContainText(/conflict|updated by another user/i)
  })
})
```

## Performance Testing Patterns

### Page Load Time Tests

```typescript
test.describe('Performance - Page Load', () => {
  test('world list loads within 200ms', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/worlds')
    await page.waitForSelector('[data-testid="world-list"]')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(200)
  })

  test('character sheet loads within 300ms', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/world/characters/char-123')
    await page.waitForSelector('[data-testid="character-sheet"]')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(300)
  })

  test('measures Core Web Vitals', async ({ page }) => {
    await page.goto('/worlds')

    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals: any = {}

          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime
            }
          })

          resolve(vitals)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })

        setTimeout(() => resolve({}), 5000)
      })
    })

    expect(metrics.FCP).toBeLessThan(1800) // Good FCP < 1.8s
    expect(metrics.LCP).toBeLessThan(2500) // Good LCP < 2.5s
  })
})
```

### API Response Time Tests

```typescript
describe('API Performance', () => {
  it('character fetch responds within 100ms', async () => {
    const startTime = performance.now()

    await fetch('/api/characters/char-123')

    const responseTime = performance.now() - startTime
    expect(responseTime).toBeLessThan(100)
  })

  it('search endpoint responds within 200ms', async () => {
    const startTime = performance.now()

    await fetch('/api/search?q=warrior&type=character')

    const responseTime = performance.now() - startTime
    expect(responseTime).toBeLessThan(200)
  })

  it('handles concurrent requests efficiently', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      fetch(`/api/characters/char-${i}`)
    )

    const startTime = performance.now()
    await Promise.all(requests)
    const totalTime = performance.now() - startTime

    // Should handle 10 concurrent requests in < 500ms
    expect(totalTime).toBeLessThan(500)
  })
})
```

### Database Query Profiling

```typescript
describe('Database Performance', () => {
  it('character query executes within 50ms', async () => {
    const startTime = performance.now()

    await prisma.character.findUnique({
      where: { id: 'char-123' },
      include: {
        traits: true,
        relationships: true
      }
    })

    const queryTime = performance.now() - startTime
    expect(queryTime).toBeLessThan(50)
  })

  it('paginated world list query is efficient', async () => {
    const startTime = performance.now()

    await prisma.world.findMany({
      take: 20,
      skip: 0,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { characters: true, locations: true }
        }
      }
    })

    const queryTime = performance.now() - startTime
    expect(queryTime).toBeLessThan(100)
  })

  it('search query uses indexes efficiently', async () => {
    // Enable query logging
    const queries: any[] = []
    prisma.$on('query' as any, (e: any) => {
      queries.push(e)
    })

    await prisma.character.findMany({
      where: {
        name: { contains: 'test', mode: 'insensitive' }
      }
    })

    // Verify index usage (query should not do full table scan)
    const query = queries[queries.length - 1]
    expect(query.query).toMatch(/WHERE.*name/i)
    expect(query.duration).toBeLessThan(20)
  })
})
```

### Bundle Size Monitoring

```typescript
describe('Bundle Size', () => {
  it('main bundle is under 200KB gzipped', async () => {
    const buildManifest = await import('.next/build-manifest.json')
    const mainBundle = buildManifest.pages['/'].find((file: string) =>
      file.includes('main')
    )

    const response = await fetch(`http://localhost:3000/_next/${mainBundle}`)
    const gzippedSize = Number(response.headers.get('content-length'))

    expect(gzippedSize).toBeLessThan(200 * 1024) // 200KB
  })

  it('page bundles use code splitting', async () => {
    const buildManifest = await import('.next/build-manifest.json')

    // Each page should have its own bundle
    expect(buildManifest.pages['/worlds']).toBeDefined()
    expect(buildManifest.pages['/characters']).toBeDefined()

    // Bundles should not overlap significantly
    const worldsBundle = buildManifest.pages['/worlds']
    const charactersBundle = buildManifest.pages['/characters']

    const overlap = worldsBundle.filter((file: string) =>
      charactersBundle.includes(file)
    )

    // Only shared chunks should overlap
    expect(overlap.length).toBeLessThan(3)
  })
})
```

### Lighthouse CI Integration

```typescript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/worlds',
        'http://localhost:3000/characters'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
}
```

## Accessibility Testing Patterns

### Using @axe-core/playwright

```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('character form is accessible', async ({ page }) => {
    await page.goto('/characters/new')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="character-form"]')
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('excludes third-party widgets from scan', async ({ page }) => {
    await page.goto('/worlds')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .exclude('#third-party-ad')
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

### WCAG 2.1 AA Compliance

```typescript
test.describe('WCAG 2.1 AA Compliance', () => {
  test('has sufficient color contrast', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )

    expect(contrastViolations).toEqual([])
  })

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/characters/new')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze()

    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label'
    )

    expect(labelViolations).toEqual([])
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/worlds')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('headings are in correct order', async ({ page }) => {
    await page.goto('/worlds')

    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => Number(el.tagName.charAt(1)))
    )

    // First heading should be h1
    expect(headings[0]).toBe(1)

    // Check no heading levels are skipped
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i - 1]
      expect(diff).toBeLessThanOrEqual(1)
    }
  })
})
```

### Keyboard Navigation Tests

```typescript
test.describe('Keyboard Navigation', () => {
  test('can navigate form with Tab key', async ({ page }) => {
    await page.goto('/characters/new')

    // Focus should start on first input
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.getAttribute('name'))
    expect(focused).toBe('name')

    // Tab to next field
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.getAttribute('name'))
    expect(focused).toBe('class')

    // Tab to submit button
    await page.keyboard.press('Tab')
    focused = await page.evaluate(() => document.activeElement?.textContent)
    expect(focused).toContain('Create')
  })

  test('can submit form with Enter key', async ({ page }) => {
    await page.goto('/characters/new')

    await page.fill('input[name="name"]', 'Test Character')
    await page.fill('input[name="class"]', 'Warrior')

    // Press Enter to submit
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/characters\/char-\w+/)
  })

  test('can navigate menu with arrow keys', async ({ page }) => {
    await page.goto('/')

    // Open menu
    await page.click('[aria-label="Menu"]')

    // Navigate with arrow down
    await page.keyboard.press('ArrowDown')
    let focused = await page.evaluate(() =>
      document.activeElement?.textContent
    )
    expect(focused).toContain('Worlds')

    await page.keyboard.press('ArrowDown')
    focused = await page.evaluate(() =>
      document.activeElement?.textContent
    )
    expect(focused).toContain('Characters')

    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/characters')
  })

  test('can close modal with Escape key', async ({ page }) => {
    await page.goto('/worlds')

    await page.click('button:has-text("Create World")')

    // Modal should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should be hidden
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('skip to main content link works', async ({ page }) => {
    await page.goto('/')

    // Tab to skip link (usually hidden)
    await page.keyboard.press('Tab')

    const skipLink = page.locator('a:has-text("Skip to main content")')
    await expect(skipLink).toBeFocused()

    // Activate skip link
    await page.keyboard.press('Enter')

    // Focus should move to main content
    const focused = await page.evaluate(() =>
      document.activeElement?.getAttribute('id')
    )
    expect(focused).toBe('main-content')
  })
})
```

### Screen Reader Compatibility

```typescript
test.describe('Screen Reader Support', () => {
  test('has proper ARIA labels', async ({ page }) => {
    await page.goto('/worlds')

    // Check navigation has aria-label
    const nav = page.locator('nav')
    await expect(nav).toHaveAttribute('aria-label', /main navigation/i)

    // Check buttons have aria-label
    const menuButton = page.locator('button[aria-label="Open menu"]')
    await expect(menuButton).toBeVisible()
  })

  test('announces form errors', async ({ page }) => {
    await page.goto('/characters/new')

    // Submit without filling
    await page.click('button[type="submit"]')

    // Error messages should have role="alert"
    const errorAlert = page.locator('[role="alert"]')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toContainText(/required/i)
  })

  test('has proper ARIA live regions', async ({ page }) => {
    await page.goto('/worlds')

    // Status messages should use aria-live
    await page.click('button:has-text("Delete"):first')

    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toContainText(/deleted successfully/i)
  })

  test('buttons have descriptive accessible names', async ({ page }) => {
    await page.goto('/characters')

    // Edit buttons should have accessible names
    const editButtons = page.locator('button[aria-label^="Edit"]')
    const count = await editButtons.count()

    for (let i = 0; i < count; i++) {
      const label = await editButtons.nth(i).getAttribute('aria-label')
      expect(label).toMatch(/Edit .+/)
    }
  })

  test('loading states are announced', async ({ page }) => {
    await page.goto('/worlds')

    // Trigger data fetch
    await page.click('button:has-text("Load More")')

    // Loading indicator should have aria-live
    const loading = page.locator('[aria-live="polite"][aria-busy="true"]')
    await expect(loading).toBeVisible()

    // Wait for load to complete
    await page.waitForSelector('[aria-busy="false"]')
  })
})
```

## Import/Export Testing Patterns

### Testing CSV Parsing

```typescript
describe('CSV Import', () => {
  it('parses valid CSV file', async () => {
    const csvData = `name,class,level
Aragorn,Ranger,20
Gandalf,Wizard,30
Frodo,Rogue,10`

    const result = await importCharactersFromCSV(csvData)

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    expect(result.data[0]).toMatchObject({
      name: 'Aragorn',
      class: 'Ranger',
      level: 20
    })
  })

  it('handles CSV with quoted fields', async () => {
    const csvData = `name,description,class
"Aragorn","Known as ""Strider""",Ranger
"Gandalf","The Grey",Wizard`

    const result = await importCharactersFromCSV(csvData)

    expect(result.data[0].description).toBe('Known as "Strider"')
    expect(result.data[1].description).toBe('The Grey')
  })

  it('validates required fields', async () => {
    const csvData = `name,class
Aragorn,
Gandalf,Wizard`

    const result = await importCharactersFromCSV(csvData)

    expect(result.success).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        row: 1,
        field: 'class',
        message: 'Required field missing'
      })
    )
  })

  it('handles malformed CSV', async () => {
    const csvData = `name,class,level
Aragorn,Ranger,20
Gandalf,Wizard
"Unclosed quote,Rogue,10`

    const result = await importCharactersFromCSV(csvData)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('supports custom field mapping', async () => {
    const csvData = `character_name,character_class,character_level
Aragorn,Ranger,20`

    const result = await importCharactersFromCSV(csvData, {
      fieldMap: {
        character_name: 'name',
        character_class: 'class',
        character_level: 'level'
      }
    })

    expect(result.data[0]).toMatchObject({
      name: 'Aragorn',
      class: 'Ranger',
      level: 20
    })
  })
})
```

### Testing Markdown Export

```typescript
describe('Markdown Export', () => {
  it('exports character to markdown', async () => {
    const character = {
      id: 'char-123',
      name: 'Aragorn',
      class: 'Ranger',
      level: 20,
      backstory: 'Heir to the throne of Gondor',
      traits: ['Brave', 'Noble', 'Skilled Fighter']
    }

    const markdown = await exportCharacterToMarkdown(character)

    expect(markdown).toContain('# Aragorn')
    expect(markdown).toContain('**Class:** Ranger')
    expect(markdown).toContain('**Level:** 20')
    expect(markdown).toContain('## Backstory')
    expect(markdown).toContain('Heir to the throne of Gondor')
    expect(markdown).toContain('## Traits')
    expect(markdown).toContain('- Brave')
    expect(markdown).toContain('- Noble')
  })

  it('exports world timeline to markdown', async () => {
    const timeline = {
      worldId: 'world-123',
      events: [
        { year: 1000, title: 'Founding of Kingdom', description: 'The first king crowned' },
        { year: 1500, title: 'Great War', description: 'War against darkness' }
      ]
    }

    const markdown = await exportTimelineToMarkdown(timeline)

    expect(markdown).toContain('# Timeline')
    expect(markdown).toContain('## Year 1000 - Founding of Kingdom')
    expect(markdown).toContain('The first king crowned')
    expect(markdown).toContain('## Year 1500 - Great War')
  })

  it('escapes markdown special characters', async () => {
    const character = {
      name: 'Character with *special* _chars_',
      backstory: 'Has [links] and #hashtags'
    }

    const markdown = await exportCharacterToMarkdown(character)

    expect(markdown).toContain('Character with \\*special\\* \\_chars\\_')
    expect(markdown).toContain('Has \\[links\\] and \\#hashtags')
  })
})
```

### Testing JSON Import/Export

```typescript
describe('JSON Import/Export', () => {
  it('exports world to JSON', async () => {
    const world = await prisma.world.findUnique({
      where: { id: 'world-123' },
      include: {
        characters: true,
        locations: true,
        timeline: { include: { events: true } }
      }
    })

    const json = await exportWorldToJSON(world)
    const parsed = JSON.parse(json)

    expect(parsed).toMatchObject({
      version: '1.0',
      world: {
        id: 'world-123',
        name: expect.any(String)
      },
      characters: expect.any(Array),
      locations: expect.any(Array),
      timeline: expect.objectContaining({
        events: expect.any(Array)
      })
    })
  })

  it('imports world from JSON', async () => {
    const jsonData = {
      version: '1.0',
      world: {
        name: 'Imported World',
        description: 'Test world'
      },
      characters: [
        { name: 'Hero', class: 'Warrior' }
      ],
      locations: [
        { name: 'Capital', type: 'city' }
      ]
    }

    const result = await importWorldFromJSON(JSON.stringify(jsonData))

    expect(result.success).toBe(true)
    expect(result.world).toMatchObject({
      name: 'Imported World',
      description: 'Test world'
    })

    // Verify data was created
    const characters = await prisma.character.findMany({
      where: { worldId: result.world.id }
    })
    expect(characters).toHaveLength(1)
    expect(characters[0].name).toBe('Hero')
  })

  it('validates JSON schema', async () => {
    const invalidJson = {
      version: '2.0', // Unsupported version
      world: { name: 'Test' }
    }

    await expect(
      importWorldFromJSON(JSON.stringify(invalidJson))
    ).rejects.toThrow('Unsupported file version')
  })

  it('handles malformed JSON', async () => {
    const malformedJson = '{ invalid json }'

    await expect(
      importWorldFromJSON(malformedJson)
    ).rejects.toThrow('Invalid JSON format')
  })
})
```

### Testing File Generation

```typescript
test.describe('File Export', () => {
  test('downloads CSV file', async ({ page }) => {
    await page.goto('/characters')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export CSV")')
    ])

    expect(download.suggestedFilename()).toMatch(/characters.*\.csv$/)

    const path = await download.path()
    const content = await fs.readFile(path, 'utf-8')

    expect(content).toContain('name,class,level')
    expect(content.split('\n').length).toBeGreaterThan(1)
  })

  test('downloads Markdown file', async ({ page }) => {
    await page.goto('/worlds/world-123')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export Markdown")')
    ])

    expect(download.suggestedFilename()).toMatch(/\.md$/)

    const path = await download.path()
    const content = await fs.readFile(path, 'utf-8')

    expect(content).toContain('# ')
    expect(content).toContain('## ')
  })

  test('downloads JSON file', async ({ page }) => {
    await page.goto('/worlds/world-123')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export JSON")')
    ])

    expect(download.suggestedFilename()).toMatch(/\.json$/)

    const path = await download.path()
    const content = await fs.readFile(path, 'utf-8')

    const parsed = JSON.parse(content)
    expect(parsed.version).toBeDefined()
    expect(parsed.world).toBeDefined()
  })
})
```

### Testing Field Mapping

```typescript
describe('Import Field Mapping', () => {
  it('auto-detects field mappings', async () => {
    const csvData = `character_name,char_class,char_level
Aragorn,Ranger,20`

    const detected = await detectFieldMapping(csvData, {
      expectedFields: ['name', 'class', 'level']
    })

    expect(detected).toEqual({
      character_name: 'name',
      char_class: 'class',
      char_level: 'level'
    })
  })

  it('allows manual field mapping', async () => {
    const csvHeaders = ['col1', 'col2', 'col3']
    const targetFields = ['name', 'class', 'level']

    renderWithProviders(
      <FieldMapper
        headers={csvHeaders}
        targetFields={targetFields}
        onMap={vi.fn()}
      />
    )

    const user = userEvent.setup()

    // Map col1 to name
    await user.selectOptions(
      screen.getByLabelText('Map col1 to:'),
      'name'
    )

    // Map col2 to class
    await user.selectOptions(
      screen.getByLabelText('Map col2 to:'),
      'class'
    )

    await user.click(screen.getByRole('button', { name: /confirm/i }))

    // Verify mapping was created
    // ...
  })

  it('validates required fields are mapped', async () => {
    const mapping = {
      col1: 'name',
      // Missing required 'class' field
    }

    const result = validateFieldMapping(mapping, {
      required: ['name', 'class']
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field: 'class',
        message: 'Required field not mapped'
      })
    )
  })
})
