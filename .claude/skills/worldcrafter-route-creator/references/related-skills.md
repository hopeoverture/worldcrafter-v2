# Related Skills - WorldCrafter Route Creator

This document explains how the worldcrafter-route-creator skill integrates with other WorldCrafter skills.

## Skill Dependencies

### Alternative Skills

**worldcrafter-feature-builder**
- **Relationship**: Route-creator and feature-builder are ALTERNATIVES, not complementary
- **When to use route-creator**: Simple static pages without forms
- **When to use feature-builder**: Complete features with forms, validation, database operations
- **Key difference**: Route-creator creates structure only, feature-builder creates complete functionality
- **Example**: "Create about page" → route-creator; "Create contact form" → feature-builder

### Complementary Skills

**worldcrafter-auth-guard**
- **Relationship**: Route-creator creates pages, auth-guard protects them
- **When to use together**: Simple pages that need authentication
- **What route-creator provides**: Page structure (page.tsx, layout.tsx, etc.)
- **What auth-guard adds**: Authentication checks, redirects, protected routes
- **Example**: Route-creator creates /dashboard → auth-guard adds auth check

**worldcrafter-test-generator**
- **Relationship**: Route-creator creates pages, test-generator tests them
- **When to use together**: Pages need test coverage
- **What route-creator provides**: Page components and routes
- **What test-generator adds**: Component tests, E2E tests for navigation
- **Example**: Route-creator creates /about → test-generator adds rendering and navigation tests

**worldcrafter-database-setup**
- **Relationship**: Route-creator can create pages that display database data
- **When to use together**: Read-only pages showing database content
- **What database-setup provides**: Prisma models and queries
- **What route-creator uses**: Models for data fetching in server components
- **Example**: Database-setup creates Product model → route-creator creates /products page displaying products

## Common Orchestration Patterns

### Pattern 1: Simple Static Pages

```
User: "Create an about us page and a privacy policy page"

Skill sequence:
1. worldcrafter-route-creator (this skill only)
   - Creates /about/page.tsx
   - Creates /privacy/page.tsx
   - Both with loading.tsx and error.tsx
   - User fills in content
```

### Pattern 2: Protected Simple Pages

```
User: "Create a dashboard page (no forms, just display data)"

Skill sequence:
1. worldcrafter-route-creator (this skill)
   - Creates /dashboard/page.tsx with layout
   - Creates loading and error states

2. worldcrafter-auth-guard
   - Adds authentication check to dashboard layout
   - Redirects to login if not authenticated
```

### Pattern 3: API Endpoints

```
User: "Create an API endpoint for fetching users"

Skill sequence:
1. worldcrafter-route-creator (this skill)
   - Creates /api/users/route.ts
   - Adds GET handler with Prisma query

2. worldcrafter-auth-guard (optional)
   - Adds auth check to protect endpoint
```

### Pattern 4: Read-Only Data Pages

```
User: "Create a page to display all blog posts"

Skill sequence:
1. worldcrafter-database-setup (if BlogPost model doesn't exist)
   - Creates BlogPost model

2. worldcrafter-route-creator (this skill)
   - Creates /posts/page.tsx
   - Adds server-side data fetching with Prisma
   - Displays posts in list
```

### Pattern 5: Marketing Pages

```
User: "Create marketing pages (home, about, contact, pricing)"

Skill sequence:
1. worldcrafter-route-creator (this skill)
   - Creates route group (marketing)/
   - Creates layout.tsx with marketing header/footer
   - Creates /about, /contact, /pricing pages
   - User adds content
```

## Skill Selection Decision Tree

```
User wants to create something?
│
├─ Is it a complete feature with forms?
│  └─ YES → Use worldcrafter-feature-builder (NOT route-creator)
│
├─ Is it a simple page without forms?
│  ├─ YES → Use worldcrafter-route-creator (this skill)
│  │
│  └─ Does it need authentication?
│     └─ YES → Use route-creator THEN auth-guard
│
├─ Is it an API endpoint?
│  ├─ YES → Use worldcrafter-route-creator (this skill)
│  │
│  └─ Does it need protection?
│     └─ YES → Use route-creator THEN auth-guard
│
└─ Is it just a layout or route structure?
   └─ YES → Use worldcrafter-route-creator (this skill)
```

## When Multiple Skills Apply

Sometimes a user's request could trigger multiple skills. Here's how to decide:

**User says: "Create a contact form"**
- Interpretation: Form with validation needed
- Skills: worldcrafter-feature-builder (NOT route-creator)
- Reason: "Form" implies validation and submission logic

**User says: "Create a contact page"**
- Interpretation: Could be static or form
- Ask user: "Do you want a contact form, or just static contact information?"
- If static: route-creator
- If form: feature-builder

**User says: "Create an about page"**
- Interpretation: Simple static content
- Skills: worldcrafter-route-creator (this skill only)
- Reason: About pages are typically static content

**User says: "Create a protected dashboard"**
- Interpretation: Simple page needing auth
- Skills: route-creator → auth-guard
- Reason: "Protected" signals auth needed, but no forms mentioned

**User says: "Create a blog post display page"**
- Interpretation: Read-only page showing database data
- Skills: database-setup (if needed) → route-creator
- Reason: Display only, no forms for creating/editing

**User says: "Create a blog post editor"**
- Interpretation: Form for creating/editing
- Skills: feature-builder (NOT route-creator)
- Reason: Editor implies forms and validation

## Preventing Skill Conflicts

### Don't Use Both Route-Creator and Feature-Builder

**They are alternatives:**
- Route-creator: Simple pages, API endpoints, layouts
- Feature-builder: Complete features with forms and database

**Example - WRONG:**
```
User: "Create a blog post feature"
1. worldcrafter-route-creator creates /posts/new
2. worldcrafter-feature-builder creates form ❌
```

**Example - CORRECT:**
```
User: "Create a blog post feature"
1. worldcrafter-feature-builder creates complete feature ✅
   (includes route, form, validation, Server Actions, tests)
```

**Example - ALSO CORRECT:**
```
User: "Create a page to view all blog posts (read-only)"
1. worldcrafter-route-creator creates /posts page ✅
2. Add data fetching with Prisma
```

### Sequential vs. Parallel Usage

**Sequential (in order):**
1. Route-creator → Auth-guard
   - Reason: Create page first, then protect it

2. Database-setup → Route-creator
   - Reason: Model must exist before page can query it

**Parallel (together):**
- Route-creator can create multiple routes simultaneously
- Don't use route-creator and feature-builder in parallel

## Integration Points

### Route-Creator → Auth-Guard

**Inputs from route-creator:**
- Page paths to protect
- Layout structure

**How auth-guard enhances route-creator:**
```typescript
// Route-creator creates this page
export default function DashboardPage() {
  return <div>Dashboard content</div>
}

// Auth-guard adds authentication
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Dashboard content for {user.email}</div>
}
```

### Route-Creator → Test-Generator

**Inputs from route-creator:**
- Page component paths
- Route structure

**How test-generator uses this:**
```typescript
// Route-creator creates page
// src/app/about/page.tsx

// Test-generator creates test
test('about page renders', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('h1')).toContainText('About')
})
```

### Database-Setup → Route-Creator

**Inputs from database-setup:**
- Prisma models for querying
- Model types for TypeScript

**How route-creator uses this:**
```typescript
// Database-setup creates BlogPost model

// Route-creator creates page that queries it
import { prisma } from '@/lib/prisma'

export default async function PostsPage() {
  const posts = await prisma.blogPost.findMany()

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

## Best Practices

1. **Use route-creator for simple pages only**
   - Static content pages (about, terms, privacy)
   - Read-only data display pages
   - API endpoints without complex logic

2. **Use feature-builder instead for:**
   - Forms with validation
   - CRUD operations
   - Complex user interactions
   - Complete features

3. **Combine with auth-guard for protected pages**
   - Create page with route-creator
   - Add auth with auth-guard
   - Two-step process is clearer than one

4. **Create layouts for shared UI**
   - Use route-creator to scaffold layout.tsx
   - Share navigation, headers, footers
   - Apply to route groups

5. **Add loading and error states**
   - Route-creator includes these by default
   - Improves user experience
   - Handles edge cases

## Common Mistakes

### Mistake 1: Using Route-Creator for Forms

```
❌ Wrong:
User: "Create a signup form"
1. worldcrafter-route-creator creates /signup page
2. User has to manually add form, validation, Server Action

✅ Correct:
User: "Create a signup form"
1. worldcrafter-feature-builder creates complete signup feature
   (includes form, validation, Server Action, tests)
```

### Mistake 2: Using Feature-Builder for Static Pages

```
❌ Wrong:
User: "Create an about page"
1. worldcrafter-feature-builder creates over-engineered solution

✅ Correct:
User: "Create an about page"
1. worldcrafter-route-creator creates simple page
2. User adds content
```

### Mistake 3: Not Adding Auth to Protected Routes

```
❌ Wrong:
Create /dashboard with route-creator, forget auth

✅ Correct:
1. Route-creator creates /dashboard
2. Auth-guard adds authentication check
```

### Mistake 4: Creating API Routes with Feature-Builder

```
❌ Wrong:
Use feature-builder to create API endpoint

✅ Correct:
Use route-creator to create route.ts with handlers
```

## Decision Matrix

| User Request | Use Route-Creator? | Why |
|-------------|-------------------|-----|
| "Create an about page" | YES | Simple static content |
| "Create a contact form" | NO | Use feature-builder instead |
| "Create a blog post editor" | NO | Use feature-builder instead |
| "Create a blog post viewer" | YES | Read-only display |
| "Add API endpoint for users" | YES | API routes are route-creator's domain |
| "Create a protected dashboard" | YES (+ auth-guard) | Simple page needing auth |
| "Add a signup form" | NO | Use feature-builder instead |
| "Create a layout for dashboard" | YES | Layouts are route-creator's domain |
| "Add a pricing page" | YES | Simple static content |
| "Create a settings form" | NO | Use feature-builder instead |
