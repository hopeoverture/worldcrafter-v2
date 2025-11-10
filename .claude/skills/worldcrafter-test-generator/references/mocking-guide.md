# Mocking Guide for WorldCrafter Tests

Comprehensive guide to mocking Supabase, Prisma, Next.js, and other dependencies in WorldCrafter tests.

## Why Mock?

**Unit Tests**: Mock external dependencies to test in isolation
**Integration Tests**: Use real database, mock only external APIs
**E2E Tests**: Minimal mocking, test real system

## Vitest Mocking Basics

### Mock a Module

```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('../api/client', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' })
}))
```

### Mock a Function

```typescript
const mockFunction = vi.fn()

// Setup return value
mockFunction.mockReturnValue('value')

// Setup promise resolution
mockFunction.mockResolvedValue({ data: 'result' })

// Setup promise rejection
mockFunction.mockRejectedValue(new Error('Failed'))

// Mock implementation
mockFunction.mockImplementation((arg) => `Result: ${arg}`)
```

### Check Mock Calls

```typescript
expect(mockFunction).toHaveBeenCalled()
expect(mockFunction).toHaveBeenCalledTimes(2)
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFunction).toHaveBeenLastCalledWith('lastArg')
```

### Clear/Reset Mocks

```typescript
beforeEach(() => {
  vi.clearAllMocks()    // Clear call history
  vi.resetAllMocks()    // Clear call history + reset implementation
  vi.restoreAllMocks()  // Restore original implementation
})
```

## Mocking Supabase Client

WorldCrafter uses Supabase for auth and database. Here's how to mock it:

### Basic Supabase Mock

```typescript
// src/test/mocks/supabase.ts
import { vi } from 'vitest'

export const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  },
  from: vi.fn((table) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
})

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => createMockSupabaseClient())
}))
```

### Mocking Authentication

```typescript
import { vi } from 'vitest'

// Mock authenticated user
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'authenticated'
          }
        },
        error: null
      })
    }
  }))
}))

// Mock unauthenticated (logged out)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })
    }
  }))
}))
```

### Mocking Supabase Queries

```typescript
// Mock successful query
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '1', title: 'Test Post' },
        error: null
      })
    }))
  }))
}))

// Mock query error
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      })
    }))
  }))
}))
```

## Mocking Prisma Client

WorldCrafter uses Prisma for database operations. In unit tests, mock it:

### Basic Prisma Mock

```typescript
// src/test/mocks/prisma.ts
import { vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>()

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock
}))

beforeEach(() => {
  mockReset(prismaMock)
})
```

### Mocking Prisma Queries

```typescript
import { prismaMock } from '@/test/mocks/prisma'

// Mock findMany
prismaMock.post.findMany.mockResolvedValue([
  { id: '1', title: 'Post 1' },
  { id: '2', title: 'Post 2' }
])

// Mock findUnique
prismaMock.post.findUnique.mockResolvedValue({
  id: '1',
  title: 'Test Post',
  content: 'Content',
  published: true
})

// Mock create
prismaMock.post.create.mockResolvedValue({
  id: 'new-id',
  title: 'New Post',
  createdAt: new Date()
})

// Mock update
prismaMock.post.update.mockResolvedValue({
  id: '1',
  title: 'Updated Title'
})

// Mock delete
prismaMock.post.delete.mockResolvedValue({
  id: '1',
  title: 'Deleted Post'
})
```

### Mocking Prisma Errors

```typescript
// Mock not found
prismaMock.post.findUnique.mockResolvedValue(null)

// Mock database error
prismaMock.post.create.mockRejectedValue(
  new Error('Unique constraint violation')
)
```

### Mocking Transactions

```typescript
prismaMock.$transaction.mockImplementation(async (callback) => {
  return callback(prismaMock)
})
```

## Mocking Next.js APIs

### Mocking useRouter

```typescript
import { vi } from 'vitest'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    prefetch: vi.fn(),
  }),
  usePathname: () => '/current-path',
  useSearchParams: () => new URLSearchParams(),
}))

// In test
expect(mockPush).toHaveBeenCalledWith('/new-path')
```

### Mocking useParams

```typescript
vi.mock('next/navigation', () => ({
  useParams: () => ({
    id: '123',
    slug: 'test-post'
  })
}))
```

### Mocking Server Actions

```typescript
// Mock Server Action
vi.mock('../actions', () => ({
  submitForm: vi.fn().mockResolvedValue({
    success: true,
    data: { id: '1', title: 'Created' }
  })
}))

// Test component that uses it
it('calls server action on submit', async () => {
  const user = userEvent.setup()
  renderWithProviders(<Form />)

  await user.type(screen.getByLabelText(/title/i), 'Test')
  await user.click(screen.getByRole('button', { name: /submit/i }))

  await waitFor(() => {
    expect(submitForm).toHaveBeenCalledWith({ title: 'Test' })
  })
})
```

### Mocking revalidatePath

```typescript
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
```

## Mocking React Query

WorldCrafter uses TanStack Query for client-side data fetching:

### Basic Query Mock

```typescript
import { vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({
    data: { posts: [] },
    isLoading: false,
    error: null,
  }),
  useMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  }),
}))
```

### Mock Loading State

```typescript
vi.mocked(useQuery).mockReturnValue({
  data: undefined,
  isLoading: true,
  error: null,
  isError: false,
  isSuccess: false,
})
```

### Mock Error State

```typescript
vi.mocked(useQuery).mockReturnValue({
  data: undefined,
  isLoading: false,
  error: new Error('Failed to fetch'),
  isError: true,
  isSuccess: false,
})
```

## Mocking fetch/API Calls

### Global fetch Mock

```typescript
global.fetch = vi.fn()

// Mock successful response
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'result' }),
  status: 200,
} as Response)

// Mock error response
vi.mocked(fetch).mockResolvedValue({
  ok: false,
  json: async () => ({ error: 'Not found' }),
  status: 404,
} as Response)

// Mock network error
vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
```

### Mock Specific API Routes

```typescript
vi.mocked(fetch).mockImplementation((url) => {
  if (url === '/api/posts') {
    return Promise.resolve({
      ok: true,
      json: async () => ({ posts: [] }),
    } as Response)
  }

  if (url === '/api/users') {
    return Promise.resolve({
      ok: true,
      json: async () => ({ users: [] }),
    } as Response)
  }

  return Promise.reject(new Error('Unknown endpoint'))
})
```

## Mocking Date/Time

### Mock Date.now()

```typescript
const mockDate = new Date('2024-01-15T12:00:00Z')

vi.setSystemTime(mockDate)

// In test
expect(Date.now()).toBe(mockDate.getTime())

// Reset
vi.useRealTimers()
```

### Mock Timers

```typescript
vi.useFakeTimers()

// Advance time
vi.advanceTimersByTime(1000) // 1 second

// Run all timers
vi.runAllTimers()

// Reset
vi.useRealTimers()
```

## Mocking Environment Variables

```typescript
vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://test-api.com')

// Or use process.env
process.env.NEXT_PUBLIC_API_URL = 'https://test-api.com'

// Reset
vi.unstubAllEnvs()
```

## Mocking File System Operations

```typescript
import fs from 'fs'

vi.mock('fs')

vi.mocked(fs.readFileSync).mockReturnValue('file contents')
vi.mocked(fs.existsSync).mockReturnValue(true)
```

## Mocking React Hooks

### Mock useState

```typescript
import { useState } from 'react'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useState: vi.fn()
  }
})

// In test
const mockSetState = vi.fn()
vi.mocked(useState).mockReturnValue(['value', mockSetState])
```

### Mock useEffect

```typescript
vi.spyOn(React, 'useEffect').mockImplementation((f) => f())
```

## Mocking External Libraries

### Mock Faker

```typescript
vi.mock('@faker-js/faker', () => ({
  faker: {
    internet: {
      email: () => 'test@example.com',
    },
    person: {
      fullName: () => 'John Doe',
    },
  },
}))
```

### Mock Third-Party Component

```typescript
// Mock an entire component
vi.mock('third-party-lib', () => ({
  ThirdPartyComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mocked-component">{children}</div>
  ),
}))
```

## Partial Mocks

### Mock Only Some Exports

```typescript
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils')
  return {
    ...actual,
    // Override only one function
    formatDate: vi.fn().mockReturnValue('Mocked Date'),
  }
})
```

## Spy on Functions

### Spy Without Mocking

```typescript
import * as utils from '@/lib/utils'

const spy = vi.spyOn(utils, 'formatDate')

// Function still works normally
const result = utils.formatDate('2024-01-15')

// But you can check if it was called
expect(spy).toHaveBeenCalled()
```

### Spy and Mock

```typescript
const spy = vi.spyOn(utils, 'formatDate').mockReturnValue('Mocked')

expect(utils.formatDate('2024-01-15')).toBe('Mocked')
expect(spy).toHaveBeenCalled()
```

## Mock Cleanup Best Practices

```typescript
beforeEach(() => {
  vi.clearAllMocks()    // Clear call history
})

afterEach(() => {
  vi.restoreAllMocks()  // Restore original implementations
})

afterAll(() => {
  vi.resetAllMocks()    // Complete reset
})
```

## Common Mocking Patterns

### Mock Once vs Always

```typescript
// Mock once (for one test)
mockFunction.mockReturnValueOnce('first call')
mockFunction.mockReturnValueOnce('second call')

// Mock always
mockFunction.mockReturnValue('always')
```

### Conditional Mocking

```typescript
mockFunction.mockImplementation((arg) => {
  if (arg === 'special') {
    return 'special result'
  }
  return 'normal result'
})
```

### Mock Different Responses

```typescript
// Success then error
mockFunction
  .mockResolvedValueOnce({ success: true })
  .mockRejectedValueOnce(new Error('Failed'))
```

## Testing with Mocks

### Verify Mock Calls

```typescript
it('calls API with correct params', async () => {
  await fetchUser('123')

  expect(fetch).toHaveBeenCalledWith('/api/users/123', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Test Mock Behavior

```typescript
it('handles loading state', () => {
  vi.mocked(useQuery).mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  })

  renderWithProviders(<Component />)

  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

## Troubleshooting Mocks

### Mock Not Working

1. Check mock is defined before import
2. Use `vi.hoisted()` for mock factory functions
3. Ensure module path is correct

### Hoisting Mocks

```typescript
// Mock factory must be hoisted
const mockSupabase = vi.hoisted(() => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/supabase/client', () => mockSupabase)
```

### Mock Type Errors

```typescript
// Type the mock properly
const mockFunction = vi.fn<[string], Promise<Data>>()

// Or use vi.mocked for better types
import { useRouter } from 'next/navigation'
vi.mocked(useRouter).mockReturnValue({ /* ... */ })
```
