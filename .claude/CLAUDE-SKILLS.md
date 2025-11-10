# WorldCrafter Skills Reference

**Skills scaffold new code** - use for building features from scratch.

## Core Skills

### worldcrafter-database-setup

**Use when**: Creating tables, adding models, setting up RLS, creating migrations
**Does**: Generates Prisma models, creates migrations, sets up RLS policies, syncs test database
**Trigger phrases**: "create database table", "add [model] model", "set up RLS", "store data"
**Typically FIRST skill** for new features

### worldcrafter-feature-builder

**Use when**: Building complete features, creating forms, adding CRUD operations
**Does**: Scaffolds pages, Server Actions, Zod validation, database CRUD, loading/error states, comprehensive tests
**Supports**: Multi-step wizards, image uploads, markdown editing, custom JSON attributes
**Trigger phrases**: "add a feature", "build a [feature]", "create [feature] with forms"
**Don't use for**: Static pages (use route-creator), DB-only (use database-setup), testing existing code (use test-generator)

### worldcrafter-route-creator

**Use when**: Creating simple pages, adding static content, creating API endpoints
**Does**: Scaffolds Next.js App Router routes with page, layout, loading, error, not-found files
**Best for**: Read-only pages, static content (about/contact/terms), API endpoints (REST, SSE, webhooks)
**Trigger phrases**: "create a page", "add route", "add about/contact/terms page", "create API endpoint"
**Don't use for**: Forms with validation (use feature-builder)

### worldcrafter-auth-guard

**Use when**: Adding authentication to routes, protecting Server Actions, implementing RBAC, adding OAuth
**Does**: Adds Supabase Auth patterns, protected routes, Server Action auth checks, role-based access (5 roles), OAuth (Google, GitHub)
**Trigger phrases**: "protect [route]", "add authentication", "require login", "add RBAC", "implement login/logout"
**Don't use when**: Building new features (feature-builder includes auth), DB-only changes

### worldcrafter-test-generator

**Use when**: Adding tests to existing features, improving coverage, testing specific functionality
**Does**: Generates tests following three-layer pyramid (unit, integration, E2E), provides templates for 80%+ coverage
**Includes**: Auth testing, form testing, database testing, AI mocking, chart testing, WebSocket testing, Page Object Models
**Trigger phrases**: "add tests", "improve coverage", "test [feature]", "write E2E tests", "generate test factory"
**Don't use when**: Building new features (feature-builder includes tests)

### worldcrafter-skill-selector

**Use when**: Unclear which skill to use, request maps to multiple skills, need guidance
**Does**: Meta-skill that helps select correct WorldCrafter skill based on request

## Common Workflows

1. **New Feature**: `database-setup` → sync test DB → `feature-builder` → `test-coverage-auditor` → `codebase-review-architect`
2. **Schema Change**: `database-setup` → `migration-reviewer` → `rls-policy-validator` → sync test DB
3. **Simple Page**: `route-creator` → `codebase-review-architect`
4. **Add Auth**: `auth-guard` → `test-generator` → `codebase-review-architect`

**Sync test DB** = Run both:

- `npm run db:test:sync` (Prisma schema)
- `npx dotenv-cli -e .env.test -- node scripts/apply-rls-migration.mjs` (RLS policies)
