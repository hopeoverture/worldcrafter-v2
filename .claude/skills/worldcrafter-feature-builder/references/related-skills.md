# Related Skills - WorldCrafter Feature Builder

This document explains how the worldcrafter-feature-builder skill integrates with other WorldCrafter skills.

## Skill Dependencies

### Primary Dependencies

These skills are commonly used **before** feature-builder:

**worldcrafter-database-setup**
- **When to use first**: Feature requires new database tables or schema changes
- **What it provides**: Prisma models, migrations, RLS policies
- **Handoff**: Once database is ready, feature-builder creates the UI layer
- **Example**: "Add blog posts" → database-setup creates BlogPost model → feature-builder creates blog form

### Complementary Skills

These skills are commonly used **after** or **alongside** feature-builder:

**worldcrafter-auth-guard**
- **When to add**: Feature requires user authentication or authorization
- **What it provides**: Auth checks, protected routes, login flows
- **Integration**: Adds auth middleware to feature-builder's generated Server Actions
- **Example**: Feature-builder creates comment form → auth-guard ensures only logged-in users can comment

**worldcrafter-test-generator**
- **When to add**: Need additional test coverage beyond what feature-builder provides
- **What it provides**: Extra unit tests, integration tests, E2E tests
- **Integration**: Supplements the basic tests feature-builder generates
- **Note**: Feature-builder already creates integration and E2E tests, so only use test-generator for additional coverage

**worldcrafter-route-creator**
- **Alternative to feature-builder**: For simple pages without forms
- **When to use instead**: Static pages, read-only content, no validation needed
- **Difference**: Route-creator is lighter; feature-builder is comprehensive

## Common Orchestration Patterns

### Pattern 1: Full-Stack Feature with Auth

```
User: "Build a blog post system where users can create, edit, and delete their own posts"

Skill sequence:
1. worldcrafter-database-setup
   - Creates BlogPost model
   - Adds RLS policies (users can only edit own posts)

2. worldcrafter-feature-builder (this skill)
   - Creates /posts routes
   - Generates post form with validation
   - Creates CRUD Server Actions
   - Adds integration and E2E tests

3. worldcrafter-auth-guard
   - Protects /posts/new route
   - Adds auth checks to Server Actions
   - Ensures RLS policies are enforced
```

### Pattern 2: Quick Feature (No Auth)

```
User: "Add a contact form to the website"

Skill sequence:
1. worldcrafter-feature-builder (this skill only)
   - Creates /contact route
   - Generates contact form with validation
   - Creates submitContact Server Action
   - Adds tests

(No database or auth needed - feature-builder handles everything)
```

### Pattern 3: Database-First Development

```
User: "I want to add user profiles to my app"

Skill sequence:
1. worldcrafter-database-setup
   - Creates UserProfile model
   - Defines fields (bio, avatar, etc.)
   - Sets up RLS policies

2. worldcrafter-feature-builder (this skill)
   - Creates /profile/edit route
   - Generates profile edit form
   - Creates update Server Action
   - Wires up to UserProfile model

3. worldcrafter-auth-guard
   - Ensures users can only edit own profile
   - Adds auth check to /profile routes
```

### Pattern 4: Iterative Development

```
Phase 1 - Basic Feature:
- worldcrafter-feature-builder creates basic blog post form

Phase 2 - Add Database:
- worldcrafter-database-setup adds BlogPost model
- Update feature-builder code to use Prisma

Phase 3 - Add Auth:
- worldcrafter-auth-guard protects routes
- Adds user ownership checks

Phase 4 - Add Tests:
- worldcrafter-test-generator adds edge case tests
- Adds performance tests
```

## Skill Selection Decision Tree

```
Need to build something?
│
├─ Is it a complete feature with forms?
│  ├─ YES → Use worldcrafter-feature-builder
│  │        (includes validation, Server Actions, tests)
│  │
│  └─ NO → Is it just a simple page?
│           └─ YES → Use worldcrafter-route-creator
│
├─ Is it only database changes?
│  └─ YES → Use worldcrafter-database-setup
│           (Prisma models, migrations, RLS)
│
├─ Is it only adding tests?
│  └─ YES → Use worldcrafter-test-generator
│           (unit, integration, E2E tests)
│
└─ Is it only adding authentication?
   └─ YES → Use worldcrafter-auth-guard
            (protect routes, auth checks)
```

## When Multiple Skills Apply

Sometimes a user's request could trigger multiple skills. Here's how to decide:

**User says: "Add a blog feature"**
- Interpretation: Complete feature needed
- Skills: database-setup → feature-builder → auth-guard
- Reason: "Feature" implies complete implementation

**User says: "Create a page for about us"**
- Interpretation: Simple static page
- Skills: route-creator only
- Reason: No forms, no database, just content

**User says: "Add user authentication"**
- Interpretation: Auth system needed
- Skills: auth-guard → possibly database-setup (if user table changes needed)
- Reason: Focus is on authentication, not feature building

**User says: "I need to store blog posts in the database"**
- Interpretation: Database design needed
- Skills: database-setup only (for now)
- Reason: No mention of UI yet, just data model

## Preventing Skill Conflicts

### Conflicting Use Cases

**Don't use feature-builder AND route-creator for the same task:**
- Feature-builder is comprehensive (includes everything route-creator does, plus more)
- Use feature-builder for forms, route-creator for simple pages
- They're alternatives, not complementary

**Don't use test-generator immediately after feature-builder:**
- Feature-builder already creates integration and E2E tests
- Only use test-generator if you need *additional* coverage
- Wait until user specifically asks for more tests

### Sequential vs. Parallel Usage

**Sequential (in order):**
1. Database-setup → Feature-builder → Auth-guard
   - Reason: Database must exist before UI, auth adds to existing feature

**Parallel (together):**
- Feature-builder can handle forms + validation simultaneously
- Database-setup can create multiple models at once
- Don't try to use feature-builder and route-creator in parallel

## Integration Points

### Feature-Builder → Database-Setup

**Inputs from database-setup:**
- Prisma model names (e.g., `BlogPost`)
- Field names and types
- Relationship definitions

**How feature-builder uses this:**
```typescript
// Server Action uses Prisma model from database-setup
const post = await prisma.blogPost.create({
  data: validated
})
```

### Feature-Builder → Auth-Guard

**Inputs from feature-builder:**
- Server Action file paths
- Route paths that need protection
- Resource ownership patterns

**How auth-guard enhances this:**
```typescript
// Feature-builder creates this Server Action
export async function updatePost(id, data) {
  const result = await prisma.post.update({ where: { id }, data })
  return result
}

// Auth-guard adds authentication
export async function updatePost(id, data) {
  const { user } = await getUser()
  if (!user) return { error: 'Unauthorized' }

  const result = await prisma.post.update({ where: { id }, data })
  return result
}
```

### Feature-Builder → Test-Generator

**Inputs from feature-builder:**
- Component paths
- Server Action paths
- Test fixtures already created

**How test-generator extends this:**
- Adds edge case tests
- Adds performance tests
- Adds accessibility tests
- Fills gaps in coverage

## Best Practices

1. **Start with database-setup if schema changes needed**
   - Define data model first
   - Then build UI layer with feature-builder

2. **Use feature-builder for complete features**
   - Don't use route-creator if you need forms
   - Feature-builder is more comprehensive

3. **Add auth-guard after feature is built**
   - Easier to add auth to working feature
   - Can test feature first without auth

4. **Let Claude orchestrate automatically**
   - Claude knows when to use multiple skills
   - Trust the skill descriptions to guide selection

5. **Use test-generator sparingly**
   - Feature-builder includes good test coverage
   - Only add test-generator for special cases
