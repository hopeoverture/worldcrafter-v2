# WorldCrafter Skill Decision Matrix

This reference provides a comprehensive decision matrix for selecting the correct WorldCrafter skill based on user requests.

## Decision Matrix Table

| User Request | Correct Skill | Why | Alternative Consideration |
|-------------|---------------|-----|---------------------------|
| "Create a blog feature" | feature-builder | Complete feature with forms | - |
| "Create a blog post table" | database-setup | Database only, no UI | - |
| "Add an about page" | route-creator | Simple static page | - |
| "Create a contact form" | feature-builder | Forms need validation | NOT route-creator |
| "Protect the dashboard" | auth-guard | Adding auth to existing | - |
| "Add login page" | auth-guard | Authentication flows | - |
| "Test the blog feature" | test-generator | Adding tests to existing | - |
| "Build user profiles" | feature-builder | Complete feature | database-setup if DB only |
| "Create an API endpoint" | route-creator | Route Handlers | - |
| "Add RLS policies" | database-setup | Database security | - |
| "Implement RBAC" | auth-guard | Role-based access | - |
| "Create a dashboard layout" | route-creator | Layout only | feature-builder if forms |
| "Add a signup form" | auth-guard | Auth flows | - |
| "Store user preferences" | database-setup | Database storage | feature-builder for complete |
| "Create a pricing page" | route-creator | Static content | - |
| "Build a comments system" | feature-builder | Complete feature | - |
| "Add tests for auth" | test-generator | Testing existing | - |
| "Create [model] table" | database-setup | Explicit database | - |
| "Add a simple page" | route-creator | Explicitly simple | - |
| "Build a form for X" | feature-builder | Explicit form | - |

## Detailed Decision Trees

### Tree 1: Is it a complete feature or just one layer?

```
User wants to add something?
│
├─ Complete feature (UI + validation + database + tests)?
│  └─ YES → feature-builder
│
├─ Just database (no UI yet)?
│  └─ YES → database-setup
│
├─ Just UI (simple page, no forms)?
│  └─ YES → route-creator
│
├─ Just tests?
│  └─ YES → test-generator
│
└─ Just auth?
   └─ YES → auth-guard
```

### Tree 2: Does it involve forms?

```
User mentions creating a page?
│
├─ Does it have forms?
│  ├─ YES → feature-builder
│  │  (Forms need validation, Server Actions)
│  │
│  └─ NO → route-creator
│     (Simple static content)
```

### Tree 3: Is it new or existing code?

```
User request?
│
├─ Building NEW feature from scratch?
│  └─ feature-builder
│     (includes database, UI, tests)
│
├─ Adding to EXISTING code?
│  ├─ Adding tests? → test-generator
│  ├─ Adding auth? → auth-guard
│  ├─ Adding database table? → database-setup
│  └─ Adding page? → route-creator or feature-builder
```

## Keyword Analysis

### feature-builder Keywords
**Primary:**
- feature, form, submit, validation, create (with forms), edit, update, delete

**Secondary:**
- build, implement, CRUD, user can, add [feature]

**Avoid when:**
- "simple page", "static", "just a table", "only database"

### database-setup Keywords
**Primary:**
- table, model, schema, database, migration, RLS, Prisma, store

**Secondary:**
- data, relationship, foreign key, constraint

**Avoid when:**
- UI mentioned, forms mentioned, "complete feature"

### test-generator Keywords
**Primary:**
- test, coverage, spec, E2E, integration, unit test

**Secondary:**
- verify, check, ensure, validate (testing context)

**Avoid when:**
- "build", "create" (unless explicitly for tests)

### route-creator Keywords
**Primary:**
- simple page, static, about, contact, terms, API endpoint, route, layout

**Secondary:**
- read-only, display, show (without forms)

**Avoid when:**
- form, submit, validation, edit, create (with forms)

### auth-guard Keywords
**Primary:**
- protect, auth, login, logout, authentication, permission, role, RBAC

**Secondary:**
- secure, access control, unauthorized, require login

**Avoid when:**
- Building new features from scratch (use feature-builder with auth)

## Context Clues

### Clue: "Users can..."

**Analysis:**
- Usually implies authentication and ownership
- May imply complete feature

**Examples:**
- "Users can create posts" → feature-builder + auth-guard
- "Users can view posts" → Could be feature-builder or route-creator
- "Users can only edit their own posts" → auth-guard (ownership check)

### Clue: "I need to store..."

**Analysis:**
- Implies database requirement
- Could be database-only or complete feature

**Examples:**
- "I need to store blog posts" → Ask: "Just database, or UI too?"
- "I need to store and display posts" → feature-builder

### Clue: "Add a [X] page"

**Analysis:**
- Could be simple page or feature
- Check for form indicators

**Examples:**
- "Add an about page" → route-creator (simple)
- "Add a contact form page" → feature-builder (form)
- "Add a blog post editor page" → feature-builder (editing)

### Clue: "Create a [X]"

**Analysis:**
- Very ambiguous
- Need more context

**Ask:**
- "Do you want the complete feature, or just the [database/page/etc.]?"

## Orchestration Decision Matrix

| User Request | Skill Sequence | Reasoning |
|-------------|----------------|-----------|
| "Build a blog with auth" | database-setup → feature-builder → auth-guard | Complete feature with auth |
| "Create a blog" | database-setup → feature-builder | Complete feature, no auth mentioned |
| "Add blog post table" | database-setup only | Database only |
| "Create about page and protect it" | route-creator → auth-guard | Simple page then protect |
| "Add comprehensive tests for blog" | test-generator only | Tests for existing |
| "Create API for users" | route-creator only | Route Handler |
| "Build admin panel" | database-setup (role) → route-creator/feature-builder → auth-guard (RBAC) | Admin feature with roles |
| "Add login" | auth-guard only | Auth flows |

## Edge Cases

### Edge Case 1: "Add a profile page"

**Problem:** Could be simple display or editing feature

**Solution:** Ask clarifying question
- "Do you want users to be able to edit their profile, or just view it?"
- If edit → feature-builder (form for editing)
- If view → route-creator (simple display)

### Edge Case 2: "Set up user management"

**Problem:** Very broad, could mean many things

**Solution:** Break down into parts
- "I'll help you set up user management. This typically includes:
  1. Users table (database-setup)
  2. User profile pages (feature-builder)
  3. Admin panel (feature-builder + auth-guard with RBAC)
  Which parts do you want to start with?"

### Edge Case 3: "Create a dashboard"

**Problem:** Could be simple or complex

**Solution:** Ask about content
- "What will the dashboard display? Just static info, or forms for data entry?"
- If static/read-only → route-creator
- If forms/editing → feature-builder

### Edge Case 4: "Add authentication"

**Problem:** Could be for new or existing features

**Solution:** Ask about scope
- "Are you adding auth to existing features, or building login/signup from scratch?"
- If existing → auth-guard
- If new → feature-builder can include auth

## Sequential vs. Parallel Decisions

### Sequential (Order Matters)

These skills must be used in order:

1. **database-setup → feature-builder**
   - Database schema must exist before UI can use it
   - Feature-builder might call database-setup automatically

2. **feature-builder → auth-guard**
   - Better to build feature first, then add auth
   - Unless user explicitly mentions auth upfront

3. **Any skill → test-generator**
   - Can't test what doesn't exist
   - Feature-builder includes basic tests, test-generator adds more

### Parallel (Independent)

These can be done independently:

- Multiple route-creator calls (create multiple pages)
- Multiple database-setup calls (create multiple tables)
- Test-generator for different features (independent tests)

### Never Parallel

These should NEVER be used in parallel for the same task:

- route-creator + feature-builder (they're alternatives)
- Multiple auth-guard calls for same route (redundant)

## Confidence Levels

### High Confidence (>90%)

Use the indicated skill without asking:

- "Add an about page" → route-creator
- "Create a [Model] table" → database-setup
- "Add tests for [X]" → test-generator
- "Protect the [route]" → auth-guard

### Medium Confidence (50-90%)

Ask ONE clarifying question:

- "Create a contact page" → Ask: "Do you need a contact form, or just info?"
- "Set up profiles" → Ask: "Just database, or complete feature?"
- "Add authentication" → Ask: "For existing or new features?"

### Low Confidence (<50%)

Ask MULTIPLE clarifying questions:

- "Create a blog" → Ask about scope (database? UI? auth?)
- "Set up user management" → Break into components
- "Build a dashboard" → Ask about complexity

## Quick Reference Cheat Sheet

| If user says... | Think... | Use... |
|-----------------|----------|--------|
| "form" | Validation needed | feature-builder |
| "simple page" | No forms | route-creator |
| "table" or "model" | Database work | database-setup |
| "protect" or "auth" | Security | auth-guard |
| "test" | Testing | test-generator |
| "API endpoint" | Route Handler | route-creator |
| "CRUD" | Complete operations | feature-builder |
| "static" | No dynamic forms | route-creator |
| "users can [verb]" | Auth + feature | feature-builder + auth-guard |
| "RLS" | Database security | database-setup |
| "role" or "permission" | RBAC | auth-guard |
| "coverage" | Testing metrics | test-generator |
