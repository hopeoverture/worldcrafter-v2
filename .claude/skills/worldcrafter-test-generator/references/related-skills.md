# Related Skills - WorldCrafter Test Generator

This document explains how the worldcrafter-test-generator skill integrates with other WorldCrafter skills.

## Skill Dependencies

### Primary Dependencies

**worldcrafter-feature-builder**
- **Relationship**: Feature-builder INCLUDES basic tests, test-generator ADDS to them
- **When to use both**: User wants comprehensive testing beyond basic coverage
- **What feature-builder provides**: Integration tests for Server Actions, E2E tests for happy paths
- **What test-generator adds**: Edge cases, error scenarios, RLS policy tests, performance tests
- **Example**: Feature-builder creates blog post form with basic tests → test-generator adds tests for validation errors, concurrent updates, RLS violations

**worldcrafter-database-setup**
- **Relationship**: Database-setup creates schema, test-generator tests database operations
- **When to use together**: Testing RLS policies, database constraints, migrations
- **What database-setup provides**: Prisma models, RLS policies, migrations
- **What test-generator tests**: Policy enforcement, constraint violations, relationship integrity
- **Example**: Database-setup creates Comment model with RLS → test-generator verifies users can't read other users' comments

### Complementary Skills

**worldcrafter-auth-guard**
- **Relationship**: Auth-guard implements auth logic, test-generator verifies it works
- **When to use together**: Testing authentication flows and protected routes
- **What auth-guard provides**: Login flows, protected routes, auth checks
- **What test-generator tests**: Login success/failure, session management, unauthorized access
- **Example**: Auth-guard protects /dashboard → test-generator creates E2E test verifying redirect to login

**worldcrafter-route-creator**
- **Relationship**: Route-creator creates simple pages, test-generator tests them
- **When to use together**: Testing route rendering, navigation, loading states
- **What route-creator provides**: Page components, layouts, route handlers
- **What test-generator tests**: Page renders correctly, navigation works, error boundaries
- **Example**: Route-creator creates /about page → test-generator verifies it renders and has correct meta tags

## Common Orchestration Patterns

### Pattern 1: Complete Feature with Comprehensive Tests

```
User: "Build a blog post feature with comprehensive test coverage"

Skill sequence:
1. worldcrafter-database-setup
   - Creates BlogPost model with RLS policies

2. worldcrafter-feature-builder
   - Creates /posts routes and forms
   - Generates basic integration tests for Server Actions
   - Generates basic E2E tests for form submission

3. worldcrafter-test-generator (this skill)
   - Adds edge case tests (empty title, XSS attempts, max length)
   - Adds RLS policy tests (verify users can't edit others' posts)
   - Adds concurrent update tests
   - Adds E2E tests for pagination, search, filtering
   - Generates BlogPost test factory

4. worldcrafter-auth-guard
   - Protects /posts/new route
   - Test-generator adds tests for auth enforcement
```

### Pattern 2: Testing Existing Code

```
User: "Add tests for the existing user profile page"

Skill sequence:
1. worldcrafter-test-generator (this skill only)
   - Analyzes existing code
   - Generates component tests
   - Generates integration tests for profile update
   - Generates E2E test for profile flow
   - Creates UserProfile test factory
```

### Pattern 3: Improving Coverage

```
User: "Coverage is at 65%, need to get to 80%"

Skill sequence:
1. Run coverage report to identify gaps
2. worldcrafter-test-generator (this skill)
   - Identifies untested files
   - Generates tests for utility functions
   - Adds missing component tests
   - Adds integration tests for edge cases
3. Verify coverage meets threshold
```

### Pattern 4: Database Testing

```
User: "Test the RLS policies on the posts table"

Skill sequence:
1. worldcrafter-test-generator (this skill only)
   - Creates integration tests with test database
   - Tests SELECT policy (users can read own posts)
   - Tests INSERT policy (users must be authenticated)
   - Tests UPDATE policy (users can only update own posts)
   - Tests DELETE policy (users can only delete own posts)
   - Verifies admin role can access all posts
```

### Pattern 5: Authentication Testing

```
User: "Test the login and signup flows"

Skill sequence:
1. worldcrafter-test-generator (this skill only)
   - Creates E2E tests for signup flow
   - Creates E2E tests for login flow
   - Creates E2E tests for password reset
   - Tests protected route redirects
   - Tests session persistence
   - Tests logout functionality
```

## Skill Selection Decision Tree

```
Need to add tests?
│
├─ Is this a NEW feature being built?
│  ├─ YES → Use worldcrafter-feature-builder
│  │        (includes basic tests automatically)
│  │
│  └─ User wants "comprehensive" or "thorough" tests?
│     └─ YES → Use feature-builder THEN test-generator
│              (test-generator adds edge cases)
│
├─ Is this testing EXISTING code?
│  └─ YES → Use worldcrafter-test-generator (this skill)
│           (generate tests for existing components/features)
│
├─ Is coverage below 80%?
│  └─ YES → Use worldcrafter-test-generator (this skill)
│           (fill gaps in test coverage)
│
└─ Need specific test type?
   ├─ E2E tests → Use worldcrafter-test-generator
   ├─ Integration tests → Use worldcrafter-test-generator
   └─ Test factories → Use worldcrafter-test-generator
```

## When Multiple Skills Apply

Sometimes a user's request could trigger multiple skills. Here's how to decide:

**User says: "Build a comments feature"**
- Interpretation: Complete feature needed
- Skills: database-setup → feature-builder (includes basic tests)
- Reason: Feature-builder includes tests, no need for test-generator unless user wants comprehensive coverage

**User says: "Build a comments feature with thorough testing"**
- Interpretation: Complete feature with comprehensive tests
- Skills: database-setup → feature-builder → test-generator
- Reason: "Thorough" signals need for test-generator to add edge cases

**User says: "Add tests for the profile page"**
- Interpretation: Testing existing code
- Skills: test-generator only
- Reason: Code already exists, just needs tests

**User says: "Test the RLS policies"**
- Interpretation: Database integration testing
- Skills: test-generator only
- Reason: Specific testing scenario

**User says: "Coverage is too low"**
- Interpretation: Need to fill test coverage gaps
- Skills: test-generator only
- Reason: Focused on improving coverage metrics

## Preventing Skill Conflicts

### Avoid Redundant Test Generation

**Don't use test-generator immediately after feature-builder:**
- Feature-builder already creates integration and E2E tests
- Only use test-generator if user explicitly wants MORE tests
- Wait for user to request additional coverage

**Example - WRONG:**
```
User: "Add a blog feature"
1. worldcrafter-feature-builder (creates feature + tests)
2. worldcrafter-test-generator (generates same tests again) ❌
```

**Example - CORRECT:**
```
User: "Add a blog feature"
1. worldcrafter-feature-builder (creates feature + tests) ✅

User: "Add more edge case tests for the blog feature"
2. worldcrafter-test-generator (adds additional tests) ✅
```

### Sequential vs. Parallel Usage

**Sequential (in order):**
1. Database-setup → Feature-builder → Test-generator
   - Reason: Database must exist, then feature, then additional tests

**Parallel (together):**
- Test-generator can generate multiple test types simultaneously
- Don't use feature-builder and test-generator in parallel for the same feature

## Integration Points

### Test-Generator → Feature-Builder

**Inputs from feature-builder:**
- Component paths to test
- Server Action signatures
- Zod schemas for validation testing
- Page routes for E2E tests

**How test-generator extends feature-builder:**
```typescript
// Feature-builder creates this integration test
test('creates blog post', async () => {
  const result = await createPost({ title: 'Test', content: 'Content' })
  expect(result.success).toBe(true)
})

// Test-generator adds edge cases
test('rejects empty title', async () => {
  const result = await createPost({ title: '', content: 'Content' })
  expect(result.success).toBe(false)
})

test('rejects XSS in content', async () => {
  const result = await createPost({
    title: 'Test',
    content: '<script>alert("xss")</script>'
  })
  expect(result.data.content).not.toContain('<script>')
})

test('enforces max title length', async () => {
  const result = await createPost({
    title: 'a'.repeat(300),
    content: 'Content'
  })
  expect(result.success).toBe(false)
})
```

### Test-Generator → Database-Setup

**Inputs from database-setup:**
- Prisma models and relationships
- RLS policy definitions
- Field constraints and validations

**How test-generator uses this:**
```typescript
// Database-setup creates RLS policy
CREATE POLICY "users can read own posts"
  ON posts FOR SELECT
  USING (auth.uid() = author_id);

// Test-generator verifies policy works
test('RLS prevents reading other users posts', async () => {
  const user1Post = await prisma.post.create({
    data: { authorId: 'user1', title: 'User 1 Post' }
  })

  // Mock auth context as user2
  const result = await getPostAsUser(user1Post.id, 'user2')

  expect(result).toBeNull() // RLS blocked access
})
```

### Test-Generator → Auth-Guard

**Inputs from auth-guard:**
- Protected route patterns
- Auth middleware configuration
- Login/signup flows

**How test-generator uses this:**
```typescript
// Auth-guard protects route
// middleware.ts: if (!user) redirect('/login')

// Test-generator creates E2E test
test('redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})

test('allows access when authenticated', async ({ page }) => {
  await loginAs(page, 'user@example.com', 'password')
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## Best Practices

1. **Let feature-builder create basic tests**
   - Don't use test-generator for new features unless user wants comprehensive coverage
   - Feature-builder includes good test coverage by default

2. **Use test-generator for existing code**
   - Test-generator is perfect for adding tests to code that wasn't generated by skills
   - Analyze existing code to generate appropriate tests

3. **Focus on gaps and edge cases**
   - Use test-generator to add tests feature-builder doesn't cover
   - Edge cases, error scenarios, performance tests, RLS tests

4. **Test database operations with integration tests**
   - Use real test database for integration tests
   - Verify RLS policies work as expected
   - Clean up test data in afterAll hooks

5. **Use E2E tests for critical paths only**
   - Don't over-test with E2E (they're slow)
   - Focus on user journeys that matter
   - Use Page Object Model for maintainability

6. **Generate test factories for models**
   - Makes it easy to create test data
   - Reduces test boilerplate
   - Ensures consistent test data structure

7. **Monitor coverage metrics**
   - Run `npm run test:coverage` regularly
   - Identify untested code
   - Use test-generator to fill gaps

## Common Mistakes

### Mistake 1: Generating Tests Before Feature Exists

```
❌ Wrong:
1. worldcrafter-test-generator creates tests
2. Realize feature doesn't exist
3. Build feature to match tests

✅ Correct:
1. Build feature (worldcrafter-feature-builder)
2. Feature-builder includes basic tests
3. Use test-generator to add more tests if needed
```

### Mistake 2: Duplicating Feature-Builder Tests

```
❌ Wrong:
1. Feature-builder creates blog feature with tests
2. Test-generator generates the same basic tests again

✅ Correct:
1. Feature-builder creates blog feature with tests
2. Test-generator adds DIFFERENT tests (edge cases, RLS, etc.)
```

### Mistake 3: Not Using Test Database

```
❌ Wrong:
Create integration tests without test database setup

✅ Correct:
1. Set up test database (.env.test)
2. Create integration tests using test database
3. Clean up test data after tests
```

### Mistake 4: Over-testing with E2E

```
❌ Wrong:
Create E2E tests for every single UI interaction

✅ Correct:
- Unit tests: Most UI interactions
- Integration tests: Server Actions and database
- E2E tests: Critical user journeys only
```

## Decision Matrix

| User Request | Use Test-Generator? | Why |
|-------------|-------------------|-----|
| "Build a blog feature" | NO | Feature-builder includes tests |
| "Build a blog with thorough tests" | YES (after feature-builder) | "Thorough" signals need for comprehensive coverage |
| "Add tests for profile page" | YES | Testing existing code |
| "Test the RLS policies" | YES | Specific testing scenario |
| "Coverage is at 60%" | YES | Need to fill coverage gaps |
| "Create E2E tests for checkout" | YES | Specific test type requested |
| "Generate test factory for User" | YES | Specific test utility requested |
