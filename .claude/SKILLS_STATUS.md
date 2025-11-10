# Claude Code Skills Status for WorldCrafter

**Last Updated:** November 9, 2024
**Status:** ✅ All skills activated and ready

---

## ✅ Active WorldCrafter Skills (6)

All custom skills are extracted and activated in `.claude/skills/`:

### 1. worldcrafter-skill-selector
**Purpose:** Meta-skill for selecting the correct skill based on user requests
**Trigger Phrases:**
- "Which skill should I use for..."
- "How do I..."
- Ambiguous requests needing clarification

**When to use:** When unclear which skill applies to the task

---

### 2. worldcrafter-feature-builder
**Purpose:** Build complete features with forms, validation, Server Actions, and tests
**Trigger Phrases:**
- "Create a [feature]"
- "Build a [feature]"
- "Add a [feature] feature"
- "Implement [feature] with forms/validation"

**What it includes:**
- Page component (page.tsx)
- Server Actions (actions.ts)
- Zod schema (schema.ts)
- Loading state (loading.tsx)
- Error boundary (error.tsx)
- Unit tests (*.test.tsx)
- Integration tests (*.integration.test.ts)
- E2E tests (*.spec.ts)

**When to use:** Building complete features with user interaction

---

### 3. worldcrafter-database-setup
**Purpose:** Create database tables, migrations, and RLS policies
**Trigger Phrases:**
- "Create a table for..."
- "Add a [Model] model"
- "Set up database for..."
- "Add RLS policies"
- "Create a migration"

**What it includes:**
- Prisma schema model
- Database migration
- RLS policies (SQL)
- Test database sync

**When to use:** Database-first development or when new tables are needed

---

### 4. worldcrafter-test-generator
**Purpose:** Add comprehensive tests to existing code
**Trigger Phrases:**
- "Add tests for..."
- "Test the [feature]"
- "Improve coverage"
- "Write tests for..."
- "Generate tests"

**What it includes:**
- Unit tests (Vitest + React Testing Library)
- Integration tests (test database)
- E2E tests (Playwright)
- Test factories
- Page Object Models

**When to use:** Adding tests to existing code or improving coverage

---

### 5. worldcrafter-route-creator
**Purpose:** Create simple pages and API endpoints without forms
**Trigger Phrases:**
- "Create a page for..." (simple, no forms)
- "Add an about/contact/terms page"
- "Create an API endpoint"
- "Add a layout"

**What it includes:**
- Page component (page.tsx)
- Layout (layout.tsx) if needed
- API route (route.ts) if API endpoint

**When to use:** Static pages, simple routes, API endpoints without complex logic

---

### 6. worldcrafter-auth-guard
**Purpose:** Add authentication and authorization to routes and actions
**Trigger Phrases:**
- "Protect the [route]"
- "Add authentication"
- "Require login"
- "Make [X] require auth"
- "Implement login/logout"
- "Add role-based access"

**What it includes:**
- Protected page template
- Protected Server Action template
- Login page template
- Middleware auth check

**When to use:** Adding auth to existing features or protecting routes

---

## ✅ Anthropic Skill-Creator (Built-in)

**Name:** `example-skills:skill-creator`
**Purpose:** Guide for creating effective skills
**Location:** plugin (anthropic-agent-skills)
**Status:** ✅ Available (no setup needed)

**Use this when:** Creating new skills or updating existing skills

**How to invoke:**
```
You: "I want to create a new skill for [purpose]"
Claude: Automatically invokes skill-creator
```

---

## Skill Selection Guide

### Decision Tree

```
What are you building?

├─ Complete feature with forms/validation?
│  → Use: worldcrafter-feature-builder
│
├─ Database table only (no UI yet)?
│  → Use: worldcrafter-database-setup
│
├─ Tests for existing code?
│  → Use: worldcrafter-test-generator
│
├─ Simple page (no forms)?
│  → Use: worldcrafter-route-creator
│
└─ Add authentication to existing code?
   → Use: worldcrafter-auth-guard
```

### Common Workflows

**1. Build Complete Feature from Scratch**
```
User: "Build a blog post system"
Flow: database-setup → feature-builder → (auth-guard if needed)
```

**2. Add Simple Static Page**
```
User: "Add an about page"
Flow: route-creator only
```

**3. Protect Existing Feature**
```
User: "Protect the dashboard"
Flow: auth-guard only
```

**4. Database-First Development**
```
User: "Set up tables for blog, I'll build UI later"
Flow: database-setup now → feature-builder later
```

**5. Improve Test Coverage**
```
User: "Coverage is only 60%"
Flow: test-generator only
```

---

## Verification

To verify skills are active, restart Claude Code and try:

```
You: "Which skill should I use for adding a contact form?"
Expected: Claude invokes worldcrafter-skill-selector
```

---

## Files Structure

```
.claude/
├── skills/
│   ├── worldcrafter-skill-selector/
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── skill-decision-matrix.md
│   │
│   ├── worldcrafter-feature-builder/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   └── scaffold-feature.py
│   │   ├── assets/
│   │   │   └── templates/
│   │   │       ├── page.tsx
│   │   │       ├── actions.ts
│   │   │       ├── schema.ts
│   │   │       └── tests/
│   │   └── references/
│   │       ├── feature-patterns.md
│   │       └── testing-guide.md
│   │
│   ├── worldcrafter-database-setup/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── generate_model.py
│   │   │   ├── generate_rls.py
│   │   │   └── sync_databases.py
│   │   ├── assets/
│   │   │   └── templates/
│   │   │       ├── model-template.prisma
│   │   │       └── rls-template.sql
│   │   └── references/
│   │       ├── prisma-patterns.md
│   │       ├── rls-policies.md
│   │       └── migration-workflow.md
│   │
│   ├── worldcrafter-test-generator/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── generate_tests.py
│   │   │   ├── generate_e2e.py
│   │   │   └── generate_factory.py
│   │   ├── assets/
│   │   │   └── templates/
│   │   │       ├── component.test.tsx
│   │   │       ├── integration.test.ts
│   │   │       ├── e2e.spec.ts
│   │   │       └── factory.ts
│   │   └── references/
│   │       ├── testing-patterns.md
│   │       ├── mocking-guide.md
│   │       └── assertion-guide.md
│   │
│   ├── worldcrafter-route-creator/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   └── scaffold-route.py
│   │   └── assets/
│   │       └── templates/
│   │           ├── page.tsx
│   │           ├── layout.tsx
│   │           └── route.ts
│   │
│   └── worldcrafter-auth-guard/
│       ├── SKILL.md
│       └── assets/
│           └── templates/
│               ├── protected-page.tsx
│               ├── protected-action.ts
│               ├── login-page.tsx
│               └── middleware-auth.ts
│
├── settings.local.json
└── SKILLS_STATUS.md (this file)
```

---

## Next Steps

1. **Restart Claude Code** to ensure all skills are loaded
2. **Test a skill** by making a request that triggers it
3. **Start Phase 1 implementation** using the skills

---

## Troubleshooting

**Skills not being invoked?**
1. Verify SKILL.md files exist: `find .claude/skills -name "SKILL.md"`
2. Check YAML frontmatter is valid (no tabs, proper format)
3. Restart Claude Code
4. Try specific trigger phrases

**Need to create a new skill?**
- Use the `example-skills:skill-creator` skill
- Follow the structure of existing WorldCrafter skills
- Add to `.claude/skills/` directory

**Skills outdated?**
- Update SKILL.md files
- Increment version in YAML frontmatter
- Add changelog entry
- Commit to git for team

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| worldcrafter-skill-selector | ✅ Active | Extracted from zip |
| worldcrafter-feature-builder | ✅ Active | Extracted from zip |
| worldcrafter-database-setup | ✅ Active | Extracted from zip |
| worldcrafter-test-generator | ✅ Active | Extracted from zip |
| worldcrafter-route-creator | ✅ Active | Extracted from zip |
| worldcrafter-auth-guard | ✅ Active | Extracted from zip |
| skill-creator (Anthropic) | ✅ Available | Built-in plugin |

**All systems ready for Phase 1 implementation! 🚀**
