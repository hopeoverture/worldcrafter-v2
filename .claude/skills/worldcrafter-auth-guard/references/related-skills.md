# Related Skills - WorldCrafter Auth Guard

This document explains how the worldcrafter-auth-guard skill integrates with other WorldCrafter skills.

## Skill Dependencies

### Complementary Skills

**worldcrafter-database-setup**
- **Relationship**: Database-setup creates RLS policies (database-level), auth-guard adds application-level checks
- **Two-layer security**: Both layers work together for defense in depth
- **When to use both**: Any feature requiring user ownership or data access control
- **What database-setup provides**: RLS policies, user ownership fields (authorId, userId)
- **What auth-guard adds**: Server Action auth checks, route protection, session management
- **Example**: Database-setup adds RLS "users can read own posts" → auth-guard adds Server Action check "if (!user) return error"

**worldcrafter-feature-builder**
- **Relationship**: Feature-builder creates features, auth-guard protects them
- **When to use together**: Features requiring user authentication
- **What feature-builder provides**: Forms, Server Actions, routes
- **What auth-guard adds**: Auth checks to Server Actions, route protection, ownership verification
- **Example**: Feature-builder creates blog post form → auth-guard adds "user must be logged in to create post"

**worldcrafter-route-creator**
- **Relationship**: Route-creator creates pages, auth-guard protects them
- **When to use together**: Simple pages needing authentication
- **What route-creator provides**: Page structure (page.tsx, layout.tsx)
- **What auth-guard adds**: Auth check with redirect to login
- **Example**: Route-creator creates /dashboard → auth-guard adds "if (!user) redirect('/login')"

**worldcrafter-test-generator**
- **Relationship**: Auth-guard implements auth, test-generator verifies it works
- **When to use together**: Testing authentication flows and protected routes
- **What auth-guard provides**: Auth logic to test
- **What test-generator tests**: Login success/failure, protected route redirects, unauthorized access
- **Example**: Auth-guard protects /dashboard → test-generator creates E2E test verifying redirect to login

## Common Orchestration Patterns

### Pattern 1: Complete Feature with Authentication

```
User: "Create a blog post system where users can create and edit their own posts"

Skill sequence:
1. worldcrafter-database-setup
   - Creates BlogPost model (id, title, content, authorId)
   - Adds RLS policies:
     * Users can read all posts
     * Users can create own posts (INSERT with authorId = auth.uid())
     * Users can update own posts (UPDATE where authorId = auth.uid())
     * Users can delete own posts (DELETE where authorId = auth.uid())

2. worldcrafter-feature-builder
   - Creates /posts/new route with form
   - Creates Server Actions (createPost, updatePost, deletePost)
   - Includes basic tests

3. worldcrafter-auth-guard (this skill)
   - Adds auth check to Server Actions:
     * Check if user is logged in
     * Verify user.id matches post.authorId for updates/deletes
   - Protects /posts/new route (redirect to login if not authenticated)

4. worldcrafter-test-generator
   - Tests unauthenticated users can't create posts
   - Tests users can't edit others' posts
   - E2E test: complete flow from login → create post → logout
```

### Pattern 2: Protecting Simple Pages

```
User: "Create a dashboard page that requires login"

Skill sequence:
1. worldcrafter-route-creator
   - Creates /dashboard/page.tsx
   - Creates layout with navigation
   - Adds loading.tsx and error.tsx

2. worldcrafter-auth-guard (this skill)
   - Adds auth check to dashboard page or layout
   - Redirects to /login if not authenticated
   - Shows user email when authenticated
```

### Pattern 3: Login/Logout Implementation

```
User: "Add login and logout functionality"

Skill sequence:
1. worldcrafter-auth-guard (this skill only)
   - Creates /login/page.tsx with email/password form
   - Creates /signup/page.tsx for new users
   - Creates LogoutButton component
   - Implements login Server Action
   - Implements signup Server Action
   - Configures redirect after login
```

### Pattern 4: Role-Based Access Control

```
User: "Add an admin panel that only admins can access"

Skill sequence:
1. worldcrafter-database-setup
   - Adds role enum (USER, ADMIN, MODERATOR) to users table
   - Sets default role to USER

2. worldcrafter-route-creator
   - Creates /admin layout and pages

3. worldcrafter-auth-guard (this skill)
   - Creates requireRole helper function
   - Adds admin role check to /admin layout
   - Redirects non-admins to /unauthorized

4. worldcrafter-test-generator
   - Tests admins can access admin panel
   - Tests regular users are redirected
```

### Pattern 5: Protecting API Endpoints

```
User: "Create an API endpoint for posts that requires authentication"

Skill sequence:
1. worldcrafter-route-creator
   - Creates /api/posts/route.ts
   - Implements GET and POST handlers

2. worldcrafter-auth-guard (this skill)
   - Adds auth check to route handlers
   - Returns 401 Unauthorized for unauthenticated requests
   - Returns user-specific data based on user.id
```

## Skill Selection Decision Tree

```
User wants to add authentication?
│
├─ Is this a NEW feature being built?
│  ├─ YES → Use worldcrafter-feature-builder
│  │        (then optionally add auth with auth-guard)
│  │
│  └─ Does it need comprehensive auth?
│     └─ YES → Use feature-builder THEN auth-guard
│
├─ Is this protecting EXISTING code?
│  └─ YES → Use worldcrafter-auth-guard (this skill)
│           (add auth to existing routes/actions)
│
├─ Is this login/logout flows only?
│  └─ YES → Use worldcrafter-auth-guard (this skill)
│           (create login pages and auth flows)
│
└─ Is this role-based access?
   └─ YES → Use database-setup THEN auth-guard
            (add role column, then implement RBAC)
```

## When Multiple Skills Apply

Sometimes a user's request could trigger multiple skills. Here's how to decide:

**User says: "Create a blog feature"**
- Interpretation: Complete feature without auth mentioned
- Skills: database-setup → feature-builder
- Reason: No auth mentioned, don't add auth unless requested

**User says: "Create a blog feature where users can post"**
- Interpretation: Complete feature with user ownership
- Skills: database-setup → feature-builder → auth-guard
- Reason: "Users can post" implies auth required

**User says: "Protect the dashboard"**
- Interpretation: Add auth to existing page
- Skills: auth-guard only (this skill)
- Reason: Page already exists, just needs protection

**User says: "Add login page"**
- Interpretation: Authentication flows needed
- Skills: auth-guard only (this skill)
- Reason: Specific to authentication implementation

**User says: "Make it so users can only edit their own posts"**
- Interpretation: Resource ownership and authorization
- Skills: database-setup (RLS) → auth-guard (ownership check)
- Reason: Needs both database and application-level protection

## Preventing Skill Conflicts

### Auth in Feature-Builder vs. Auth-Guard

**When to include auth in feature-builder:**
- User explicitly mentions auth in feature request
- Feature is being built from scratch with auth

**When to use auth-guard separately:**
- Feature already exists, needs auth added later
- User wants to add auth as separate step
- Clearer separation of concerns

**Example - Include in feature-builder:**
```
User: "Create a blog post feature with user authentication"
1. worldcrafter-database-setup (BlogPost model + RLS)
2. worldcrafter-feature-builder (includes auth checks in Server Actions)
```

**Example - Use auth-guard separately:**
```
User: "Create a blog post feature"
1. worldcrafter-database-setup (BlogPost model)
2. worldcrafter-feature-builder (Server Actions)

User: "Now protect it so users must be logged in"
3. worldcrafter-auth-guard (add auth checks)
```

### Two-Layer Security Pattern

**Database Layer (RLS):**
- Created by worldcrafter-database-setup
- Enforces access control at database level
- Prevents unauthorized data access even if application auth is bypassed

**Application Layer (Auth Checks):**
- Created by worldcrafter-auth-guard
- Enforces access control in Server Actions and routes
- Provides better user experience (redirects, error messages)

**Both layers working together:**
```typescript
// Application layer (auth-guard)
export async function updatePost(id: string, data: PostData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }  // Better UX
  }

  // Database layer (RLS) also prevents this if user doesn't own post
  const result = await prisma.post.update({ where: { id }, data })

  return { success: true, data: result }
}
```

## Integration Points

### Auth-Guard → Database-Setup

**Inputs from database-setup:**
- User table with id, email, role fields
- RLS policies to complement
- Ownership fields (authorId, userId)

**How auth-guard uses database-setup:**
```typescript
// Database-setup creates users table with role

// Auth-guard uses it for RBAC
async function requireRole(allowedRoles: string[]) {
  const { user } = await getUser()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!allowedRoles.includes(dbUser.role)) {
    redirect('/unauthorized')
  }
}
```

### Auth-Guard → Feature-Builder

**Inputs from feature-builder:**
- Server Action file paths
- Route paths to protect
- Forms that need auth

**How auth-guard enhances feature-builder:**
```typescript
// Feature-builder creates this Server Action
export async function createPost(data: PostData) {
  const result = await prisma.post.create({ data })
  return { success: true, data: result }
}

// Auth-guard adds authentication
export async function createPost(data: PostData) {
  // Auth check added by auth-guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const result = await prisma.post.create({
    data: { ...data, authorId: user.id }
  })
  return { success: true, data: result }
}
```

### Auth-Guard → Route-Creator

**Inputs from route-creator:**
- Page component paths
- Layout paths
- Route structure

**How auth-guard protects routes:**
```typescript
// Route-creator creates this page
export default function DashboardPage() {
  return <div>Dashboard</div>
}

// Auth-guard adds protection
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Dashboard for {user.email}</div>
}
```

### Auth-Guard → Test-Generator

**Inputs from auth-guard:**
- Protected routes to test
- Login/logout flows to test
- Auth Server Actions to test

**How test-generator uses auth-guard:**
```typescript
// Auth-guard protects /dashboard

// Test-generator creates E2E test
test('redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})

test('shows dashboard when authenticated', async ({ page }) => {
  await loginAs(page, 'user@example.com', 'password')
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/dashboard')
})
```

## Best Practices

1. **Use two-layer security**
   - Database-setup creates RLS policies
   - Auth-guard adds application-level checks
   - Both layers provide defense in depth

2. **Protect Server Actions, not just routes**
   - Routes can be called directly
   - Always check auth in Server Actions
   - Route protection is UX, Server Action auth is security

3. **Check resource ownership**
   - Verify user owns resource before operations
   - Don't rely solely on RLS
   - Provide better error messages

4. **Use layouts for route groups**
   - Protect entire sections with layout auth
   - Reduces code duplication
   - Single point of auth for multiple pages

5. **Implement proper redirects**
   - Redirect to login with returnTo parameter
   - Redirect after login to intended page
   - Better user experience

6. **Test auth flows thoroughly**
   - Test login success and failure
   - Test protected route redirects
   - Test unauthorized access attempts
   - Use test-generator for comprehensive coverage

## Common Mistakes

### Mistake 1: Only Protecting Routes, Not Server Actions

```
❌ Wrong:
Protect route with auth, but Server Action has no auth check

✅ Correct:
Protect both route AND Server Action
```

### Mistake 2: Client-Side Auth Only

```
❌ Wrong:
Check auth in client component only

✅ Correct:
Check auth in server components and Server Actions
Client-side auth is for UX, server-side is for security
```

### Mistake 3: Not Using RLS

```
❌ Wrong:
Only use application-level auth, no RLS

✅ Correct:
Use both RLS (database-setup) and application auth (auth-guard)
Defense in depth
```

### Mistake 4: Forgetting Resource Ownership

```
❌ Wrong:
Check if user is logged in, but not if they own the resource

✅ Correct:
Check authentication AND authorization
Verify user.id matches resource.authorId
```

## Decision Matrix

| User Request | Use Auth-Guard? | Why |
|-------------|-----------------|-----|
| "Create a blog feature" | MAYBE | Only if user mentions auth |
| "Protect the dashboard" | YES | Adding auth to existing page |
| "Add login page" | YES | Auth flows are auth-guard's domain |
| "Users can only edit their own posts" | YES | Resource ownership and authorization |
| "Add admin panel" | YES | Role-based access control |
| "Create a simple about page" | NO | No auth needed |
| "Implement role permissions" | YES | RBAC implementation |
| "Test the login flow" | NO | Use test-generator instead |

## Security Checklist

When using auth-guard, ensure:
- ✅ Server Actions check authentication
- ✅ Protected routes redirect to login
- ✅ Resource ownership verified
- ✅ RLS policies enabled (via database-setup)
- ✅ HTTP-only cookies used
- ✅ Sessions refresh via middleware
- ✅ Error messages don't leak info
- ✅ Auth tests verify protection works
