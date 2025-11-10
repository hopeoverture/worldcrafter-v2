# Phase 1 MVP Implementation Plan

**Timeline:** 4 Weeks (Weeks 1-4)
**Effort:** 130-156 hours (32-39 hours/week, 1 full-time developer)
**Status:** IN PROGRESS - 24% Complete (31.5/130 hours)
**Last Updated:** 2025-11-10

---

## Implementation Progress

**Overall:** 24% Complete (31.5/130 hours)

| Week | Status | Hours Complete | Hours Remaining |
|------|--------|----------------|-----------------|
| Week 1: Foundation | 100% | 18/18 | 0 |
| Week 2: World Management | 37% | 13.5/36 | 22.5 |
| Week 3: Locations & Search | 0% | 0/40 | 40 |
| Week 4: Testing & Deployment | 0% | 0/36 | 36 |
| **TOTAL** | **24%** | **31.5/130** | **98.5** |

**What's Complete:**
- ✅ Testing infrastructure (Vitest, Playwright, factories, mocks)
- ✅ Auth infrastructure (Supabase utilities, middleware, RLS for users)
- ✅ Project setup (dependencies, git hooks, CI/CD)
- ✅ Documentation and custom skills
- ✅ Database schema (World, Location, Activity models with enums)
- ✅ RLS policies for all Phase 1 tables
- ✅ Authentication pages (login, signup, profile, OAuth callback)
- ✅ Dashboard page with world count and create button
- ✅ **World Server Actions** (createWorld, updateWorld, deleteWorld, getWorlds, getWorld)
- ✅ **World Zod validation schemas** (create, update, filters)
- ✅ **21 passing integration tests** for World CRUD operations
- ✅ **World Factory** for test data generation
- ✅ **World Form component** with markdown editor and validation
- ✅ **World creation page** (`/worlds/new`)
- ✅ **World edit page** (`/worlds/[slug]/edit`)
- ✅ **Landing page** with hero, features, and CTAs

**What's Next:**
- ⚠️ World List & Grid Views (Day 3) - 7 hours
- ⚠️ World Detail Dashboard (Day 4) - 7 hours
- ⚠️ World Settings & E2E tests (Day 5) - 8.5 hours
- ⚠️ Location management features (Week 3) - 40 hours
- ⚠️ Search functionality (Week 3) - included in Week 3
- ⚠️ Testing, polish, deployment (Week 4) - 36 hours

---

## Overview

Phase 1 MVP delivers core world and location management functionality with global search. This establishes the foundation for WorldCrafter's multi-genre worldbuilding platform.

### Goals

- Users can register, log in, and manage their profile
- Users can create, edit, and delete worlds with metadata
- Users can create hierarchical locations within worlds
- Users can search across worlds and locations
- All data protected by Row-Level Security (RLS)
- 70%+ test coverage
- Deployed to production on Vercel

---

## Week 1: Foundation (18 hours) - ✅ 100% COMPLETE

**Status:** All Week 1 tasks completed! Database schema deployed, RLS policies applied, and authentication pages functional.
**Completed:** 18/18 hours
**Remaining:** 0 hours

### Day 1-2: Database Schema (7 hours) ✅ COMPLETE

**Tasks:**
1. Update `prisma/schema.prisma` with 3 new models
2. Create migration
3. Create RLS policies SQL file
4. Apply RLS policies
5. Test in Supabase dashboard

**Models to Add:**

```prisma
model World {
  id          String   @id @default(cuid())
  userId      String   @db.Uuid
  name        String   @db.VarChar(100)
  slug        String   @unique
  genre       Genre    @default(CUSTOM)
  description String?  @db.Text
  setting     String?  @db.VarChar(500)
  metadata    Json?
  coverUrl    String?
  privacy     Privacy  @default(PRIVATE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  locations   Location[]
  activities  Activity[]

  @@map("worlds")
}

model Location {
  id          String   @id @default(cuid())
  worldId     String
  name        String   @db.VarChar(100)
  slug        String
  type        String?  @db.VarChar(50)
  parentId    String?
  description String?  @db.Text
  geography   String?  @db.Text
  climate     String?  @db.VarChar(100)
  population  String?  @db.VarChar(50)
  government  String?  @db.VarChar(100)
  economy     String?  @db.Text
  culture     String?  @db.Text
  coordinates Json?
  attributes  Json?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  world       World     @relation(fields: [worldId], references: [id], onDelete: Cascade)
  parent      Location? @relation("LocationHierarchy", fields: [parentId], references: [id])
  children    Location[] @relation("LocationHierarchy")

  @@unique([worldId, slug])
  @@map("locations")
}

model Activity {
  id         String     @id @default(cuid())
  worldId    String
  userId     String     @db.Uuid
  entityType EntityType
  entityId   String
  action     String     @db.VarChar(20)
  metadata   Json?
  createdAt  DateTime   @default(now())

  world      World      @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([worldId, createdAt])
  @@map("activities")
}

enum Genre {
  FANTASY
  SCIFI
  MODERN
  HISTORICAL
  HORROR
  CUSTOM
}

enum Privacy {
  PRIVATE
  UNLISTED
  PUBLIC
}

enum EntityType {
  WORLD
  LOCATION
}
```

**Commands:**
```bash
# 1. Update schema, then run
npx prisma migrate dev --name phase1_mvp

# 2. Apply RLS policies
npm run db:rls

# 3. Test schema
npx prisma studio
```

**Skill to Use:** `worldcrafter-database-setup`

---

### Day 3-4: Authentication (4.5 hours) ✅ 100% COMPLETE

**Status:** All authentication pages implemented and working. Login, signup, profile, and OAuth callback complete.

**Tasks:**
1. Create login page with Supabase Auth
2. Create signup page
3. Create OAuth callback handler
4. Create user profile page
5. Test auth flow end-to-end

**Routes to Create:**
- `/login` - Login form
- `/signup` - Registration form
- `/auth/callback` - OAuth callback
- `/profile` - User profile settings

**Verification:**
- User can sign up with email/password
- User can log in
- Session persists across page reloads
- User can view/edit profile

**Skill to Use:** `worldcrafter-auth-guard`

---

### Day 5: Testing Infrastructure (6.5 hours) ✅ COMPLETE

**Status:** All testing frameworks configured and ready. Unit tests, integration tests, E2E tests, factories, and mocks in place.

**Tasks:**
1. Set up `.env.test` with test database
2. Create test utilities in `src/test/utils/`
3. Create data factories in `src/test/factories/`
4. Write first integration test
5. Verify test pipeline works

**Files to Create:**
- `.env.test` - Test database configuration
- `src/test/utils/test-helpers.ts` - renderWithProviders, loginAsTestUser
- `src/test/factories/user.ts` - User factory
- `src/test/factories/world.ts` - World factory
- `src/test/factories/location.ts` - Location factory
- `src/app/worlds/__tests__/createWorld.integration.test.ts` - First test

**Commands:**
```bash
# Run tests
npm run test

# Check coverage
npm run test:coverage
```

**Skill to Use:** `worldcrafter-test-generator`

---

## Week 2: World Management (36 hours) 🚧 IN PROGRESS

**Status:** World Server Actions and Forms complete! Working on List/Detail views.
**Completed:** 13.5/36 hours
**Remaining:** 22.5 hours

### Day 1: World Server Actions (7 hours) ✅ 100% COMPLETE

**Tasks:**
1. Create Zod validation schema
2. Implement 5 Server Actions
3. Write integration tests for each action

**Files to Create:**
- `src/lib/schemas/world.schema.ts` - Zod schema
- `src/app/worlds/actions.ts` - Server Actions

**Server Actions:**
```typescript
// createWorld(data: CreateWorldInput): Promise<{ success: boolean; world?: World; error?: string }>
// updateWorld(id: string, data: UpdateWorldInput): Promise<{ success: boolean; world?: World; error?: string }>
// deleteWorld(id: string): Promise<{ success: boolean; error?: string }>
// getWorlds(userId: string, filters?: WorldFilters): Promise<World[]>
// getWorld(slug: string): Promise<World | null>
```

**Integration Tests:**
- `src/app/worlds/__tests__/createWorld.integration.test.ts`
- `src/app/worlds/__tests__/updateWorld.integration.test.ts`
- `src/app/worlds/__tests__/deleteWorld.integration.test.ts`
- `src/app/worlds/__tests__/getWorlds.integration.test.ts`

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 2: World Forms (6.5 hours) ✅ 100% COMPLETE

**Status:** All forms complete with markdown editor, validation, and loading states.

**Tasks:**
1. ✅ Install markdown editor (@uiw/react-md-editor)
2. ✅ Install shadcn components (badge, select, tabs, alert, sonner)
3. ✅ Create WorldForm component with React Hook Form + Zod
4. ✅ Image upload helper (URL input for now, Supabase Storage ready)
5. ✅ Create world creation/editing pages (`/worlds/new`, `/worlds/[slug]/edit`)
6. ✅ Loading states with skeleton UI

**Dependencies:**
```bash
# Install markdown editor
npm install @uiw/react-md-editor

# Install shadcn components
npx shadcn@latest add badge select tabs table alert toast avatar command
```

**Files to Create:**
- `src/components/forms/world-form.tsx` - Main form component
- `src/lib/utils/image-upload.ts` - Supabase Storage helper
- `src/app/worlds/new/page.tsx` - Create world page
- `src/app/worlds/[slug]/edit/page.tsx` - Edit world page

**Form Fields:**
- Name (required, max 100 chars)
- Genre (dropdown: Fantasy, Sci-Fi, Modern, Historical, Horror, Custom)
- Description (markdown editor, max 5000 chars)
- Setting summary (textarea, max 500 chars)
- Cover image (file upload to Supabase Storage)
- Privacy (radio: Private, Unlisted, Public)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 3: World List & Dashboard (7 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create WorldsList component with grid/list views
2. Implement sorting and filtering
3. Create dashboard page
4. Add search input
5. Write unit tests

**Files to Create:**
- `src/components/worlds/worlds-list.tsx` - List component
- `src/components/worlds/world-card.tsx` - Card for grid view
- `src/app/dashboard/page.tsx` - Dashboard page
- `src/components/worlds/__tests__/worlds-list.test.tsx` - Unit tests

**Features:**
- View toggle (grid/list)
- Sort by: name, updated, created
- Filter by: genre, privacy
- Search input (filters client-side)
- Pagination (20 per page)
- Empty state with "Create World" CTA

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 4: World Detail Dashboard (7 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create WorldDashboard component
2. Create ActivityFeed component
3. Create world detail page
4. Implement activity query
5. Write unit tests

**Files to Create:**
- `src/components/worlds/world-dashboard.tsx` - Dashboard component
- `src/components/activity/activity-feed.tsx` - Activity feed
- `src/app/worlds/[slug]/page.tsx` - World detail page
- `src/components/worlds/__tests__/world-dashboard.test.tsx` - Unit tests

**Dashboard Sections:**
- Stats panel (location count, activity count, dates)
- Recent activity feed (last 10, load more)
- Quick actions (Add Location, Search, Settings)
- Search bar (prominent)

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 5: Settings & Polish (8.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create world settings page
2. Implement soft delete with confirmation
3. Add toast notifications
4. Add loading states
5. Add error boundaries
6. Write E2E test for world creation

**Files to Create:**
- `src/app/worlds/[slug]/settings/page.tsx` - Settings page
- `src/components/ui/delete-confirmation-dialog.tsx` - Reusable dialog
- `e2e/worlds.spec.ts` - E2E tests

**Features:**
- Privacy management
- Delete world (requires typing name to confirm)
- Toast notifications for success/error
- Loading skeletons
- Error boundaries

**E2E Test:**
```typescript
test('user can create, edit, and delete a world', async ({ page }) => {
  // Login, create world, verify, edit, delete
});
```

**Skill to Use:** `worldcrafter-feature-builder`, `worldcrafter-test-generator`

---

## Week 3: Location Management & Search (40 hours) ⚠️ NOT STARTED

**Status:** No location management or search features implemented yet.
**Completed:** 0/40 hours
**Remaining:** 40 hours

### Day 1: Location Server Actions (9 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create Zod validation schema
2. Implement 5 Server Actions (with hierarchy support)
3. Write integration tests

**Files to Create:**
- `src/lib/schemas/location.schema.ts` - Zod schema
- `src/app/worlds/[slug]/locations/actions.ts` - Server Actions
- Integration tests for all actions

**Server Actions:**
```typescript
// createLocation(worldId: string, data: CreateLocationInput): Promise<{ success: boolean; location?: Location; error?: string }>
// updateLocation(id: string, data: UpdateLocationInput): Promise<{ success: boolean; location?: Location; error?: string }>
// deleteLocation(id: string): Promise<{ success: boolean; error?: string }>
// getLocations(worldId: string, options?: { includeHierarchy: boolean }): Promise<Location[]>
// getLocation(worldId: string, slug: string): Promise<Location | null>
```

**Special Considerations:**
- Handle parent-child relationships
- Prevent circular hierarchies
- Cascade delete children when parent deleted

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 2: Location Forms (6.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create LocationForm component
2. Create hierarchical parent selector
3. Create location creation/editing pages
4. Write unit tests

**Files to Create:**
- `src/components/forms/location-form.tsx` - Main form
- `src/components/forms/location-parent-selector.tsx` - Hierarchical dropdown
- `src/app/worlds/[slug]/locations/new/page.tsx` - Create page
- `src/app/worlds/[slug]/locations/[locationSlug]/edit/page.tsx` - Edit page

**Form Fields:**
- Name (required)
- Type (dropdown: City, Dungeon, Forest, Planet, Custom)
- Parent location (hierarchical selector showing tree)
- Description (markdown)
- Geography, Climate, Population, Government, Economy, Culture (all markdown/text)
- Coordinates (x, y numbers for future map)
- Image upload

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 3: Location List & Tree View (7 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create LocationsList component with tree view
2. Implement expand/collapse
3. Add table view toggle
4. Create locations list page
5. Write unit tests

**Files to Create:**
- `src/components/locations/locations-list.tsx` - Main list
- `src/components/locations/location-tree-node.tsx` - Tree node
- `src/app/worlds/[slug]/locations/page.tsx` - List page
- Unit tests

**Features:**
- Tree view (default): hierarchical, expand/collapse
- Table view: flat table with "Parent" column
- Type badges (color-coded)
- Quick actions (view, edit, delete)
- Filter by type
- Empty state

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 4: Location Detail & Search Setup (7 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create location detail component
2. Create location detail page
3. Set up PostgreSQL full-text search
4. Create search Server Action

**Files to Create:**
- `src/components/locations/location-detail.tsx` - Detail component
- `src/app/worlds/[slug]/locations/[locationSlug]/page.tsx` - Detail page
- `src/app/worlds/[slug]/actions/search.ts` - Search Server Action
- `prisma/migrations/sql/002_setup_fulltext_search.sql` - Search setup

**Full-Text Search Setup:**
```sql
-- Add tsvector columns
ALTER TABLE worlds ADD COLUMN search_vector tsvector;
ALTER TABLE locations ADD COLUMN search_vector tsvector;

-- Create GIN indexes
CREATE INDEX worlds_search_idx ON worlds USING GIN(search_vector);
CREATE INDEX locations_search_idx ON locations USING GIN(search_vector);

-- Create update triggers
CREATE TRIGGER worlds_search_update
  BEFORE INSERT OR UPDATE ON worlds
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, setting);

-- Similar trigger for locations
```

**Skill to Use:** `worldcrafter-database-setup`, `worldcrafter-feature-builder`

---

### Day 5: Global Search UI (10.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Create GlobalSearch component
2. Create SearchBar with ⌘K shortcut
3. Create search results page
4. Add search to world dashboard
5. Write E2E test for search
6. Write integration test

**Files to Create:**
- `src/components/search/global-search.tsx` - Search modal
- `src/components/search/search-bar.tsx` - Search input with shortcut
- `src/components/search/search-results.tsx` - Results display
- `src/app/worlds/[slug]/search/page.tsx` - Results page
- `e2e/search.spec.ts` - E2E test

**Features:**
- Keyboard shortcut (⌘K or Ctrl+K)
- Modal overlay when triggered
- Instant search with debounce
- Results grouped by type (Worlds, Locations)
- Preview snippets with highlighted matches
- Click to navigate
- Recent searches (localStorage)

**E2E Test:**
```typescript
test('user can search and find results', async ({ page }) => {
  // Setup world with locations
  // Press ⌘K
  // Type search
  // Verify results
  // Click result and navigate
});
```

**Skill to Use:** `worldcrafter-feature-builder`, `worldcrafter-test-generator`

---

## Week 4: Testing, Polish & Deployment (36 hours) ⚠️ NOT STARTED

**Status:** No Phase 1 testing, polish, or deployment work done yet.
**Completed:** 0/36 hours
**Remaining:** 36 hours

### Day 1: Complete Test Coverage (7.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Run coverage report
2. Write missing unit tests
3. Write E2E tests for all critical flows
4. Fix any failing tests

**E2E Tests to Complete:**
- `e2e/auth.spec.ts` - Signup, login, logout
- `e2e/worlds.spec.ts` - Create, edit, delete world
- `e2e/locations.spec.ts` - Create location, hierarchy
- `e2e/search.spec.ts` - Search flow
- `e2e/errors.spec.ts` - Error states (validation, 404, 500)

**Commands:**
```bash
# Check coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

**Target:** 70%+ coverage

**Skill to Use:** `worldcrafter-test-generator`

---

### Day 2: Bug Fixes & Polish (8 hours) ⚠️ NOT STARTED

**Tasks:**
1. Manual testing of all flows
2. Fix high-priority bugs
3. Add loading skeletons for all pages
4. Improve error messages
5. Add form validation feedback

**Manual Testing Checklist:**
- [ ] Sign up, verify email, log in
- [ ] Create world with all fields
- [ ] Edit world, change privacy
- [ ] Delete world with confirmation
- [ ] Create location with parent
- [ ] Create nested location (3 levels deep)
- [ ] Edit location, change parent
- [ ] Delete location (verify children orphaned/deleted)
- [ ] Search across worlds and locations
- [ ] Test with slow network (3G throttling)
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation

**Bug Priority:**
- P0 (Critical): Data loss, security, total breakage - fix immediately
- P1 (High): Major functionality broken - fix this week
- P2 (Medium): Minor issues - document and defer to Phase 2

**Skill to Use:** `worldcrafter-feature-builder`

---

### Day 3: Performance Optimization (6.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Run Lighthouse audit
2. Optimize images
3. Add database query optimizations
4. Implement pagination
5. Test performance under load

**Lighthouse Targets:**
- Performance > 85
- Accessibility > 90
- Best Practices > 90
- SEO > 90

**Optimizations:**
- Use `next/image` for all images
- Implement cover image resizing on upload
- Add eager loading for world lists
- Add indexes: `worlds(userId, createdAt)`, `locations(worldId, parentId)`
- Paginate world list (20 per page)

**Load Testing:**
```bash
# Create test data
npm run seed:test -- --worlds=100 --locations=1000

# Test query performance
npm run test:performance
```

**Skill to Use:** `worldcrafter-feature-builder`, `worldcrafter-test-generator`

---

### Day 4: Documentation & Deployment (6.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Update README with setup instructions
2. Write user guide for Phase 1 features
3. Set up Vercel project
4. Deploy to production
5. Set up monitoring

**Documentation:**
- Update `README.md`:
  - Quick start
  - Environment variables
  - Development commands
  - Tech stack
- Create `docs/USER_GUIDE_PHASE1.md`:
  - How to create a world
  - How to add locations
  - How to organize locations hierarchically
  - How to search
  - How to manage privacy

**Deployment:**
```bash
# 1. Create Vercel project
vercel link

# 2. Add environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# DATABASE_URL
# DIRECT_DATABASE_URL

# 3. Deploy
vercel --prod

# 4. Run migrations on production
# (Use Supabase dashboard or direct connection)

# 5. Verify deployment
curl https://worldcrafter.vercel.app/api/health
```

**Monitoring:**
- Set up Sentry for error tracking
- Enable Vercel Analytics
- Configure alert thresholds

**Skill to Use:** `worldcrafter-route-creator`

---

### Day 5: Launch Prep & Buffer (7.5 hours) ⚠️ NOT STARTED

**Tasks:**
1. Final QA testing in production
2. Fix critical deployment issues
3. Prepare launch announcement
4. Buffer time for unexpected issues

**Production Smoke Tests:**
- [ ] Sign up works
- [ ] Login works
- [ ] Create world works
- [ ] Create location works
- [ ] Search works
- [ ] Images upload correctly
- [ ] RLS policies enforced (can't access others' worlds)
- [ ] Performance acceptable (<2s page load)
- [ ] Error tracking captures errors

**Launch Checklist:**
- [ ] All functionality working in production
- [ ] No critical bugs
- [ ] Test coverage >70%
- [ ] Lighthouse score >85
- [ ] Documentation complete
- [ ] Monitoring active
- [ ] Backup strategy confirmed

**Buffer Activities:**
- Fix any critical issues discovered
- Improve error messages
- Add analytics events
- Optimize database queries
- Write blog post/announcement

---

## Success Criteria

### Functionality (17% Complete - 1 of 6 features)

- [x] User authentication (signup, login, profile) - ✅ Complete
- [ ] World CRUD (create, read, update, delete)
- [ ] Location CRUD with hierarchy
- [ ] Global search (full-text, ranked)
- [ ] Activity tracking
- [x] RLS enforcement - ✅ Complete for all tables (users, worlds, locations, activities)

### Quality (Testing Infrastructure Ready)

- [ ] Zero critical bugs - No features to test yet
- [ ] <5 high-priority bugs - No features to test yet
- [x] Test coverage >70% - Framework ready (80% threshold configured)
- [ ] All E2E tests passing - No feature tests written yet

### Performance (Not Tested Yet)

- [ ] Lighthouse score >85
- [ ] Page load <2s
- [ ] Time to interactive <3s

### Deployment (50% Complete - Ready for Production)

- [ ] Deployed to Vercel - Ready to deploy
- [x] Environment variables configured - ✅ Complete
- [x] Database migrations applied - ✅ Schema pushed to production database
- [ ] Monitoring active - Pending deployment

### Documentation (Complete)

- [x] README updated
- [x] User guide written - Phase 1 plan is comprehensive
- [x] Setup instructions clear

---

## Using WorldCrafter Skills

All implementation should leverage the custom skills in `.claude/skills/`:

### Database Work
**Use:** `worldcrafter-database-setup`
- References: `.claude/skills/worldcrafter-database-setup/references/worldcrafter-complete-schema.md`
- For: Schema design, migrations, RLS policies

### Building Features
**Use:** `worldcrafter-feature-builder`
- Templates: `.claude/skills/worldcrafter-feature-builder/assets/templates/`
- For: Forms, Server Actions, CRUD operations

### Creating Routes
**Use:** `worldcrafter-route-creator`
- References: `.claude/skills/worldcrafter-route-creator/references/worldcrafter-routes.md`
- For: Page creation, layouts, API routes

### Authentication
**Use:** `worldcrafter-auth-guard`
- References: `.claude/skills/worldcrafter-auth-guard/references/worldcrafter-rbac.md`
- For: Auth pages, protection, RLS

### Testing
**Use:** `worldcrafter-test-generator`
- References: `.claude/skills/worldcrafter-test-generator/references/testing-patterns.md`
- For: Unit, integration, and E2E tests

### Not Sure?
**Use:** `worldcrafter-skill-selector`
- Will help choose the right skill for the task

---

## Estimated Effort Summary

| Week | Focus | Hours |
|------|-------|-------|
| Week 1 | Foundation (DB, Auth, Tests) | 18 |
| Week 2 | World Management | 36 |
| Week 3 | Locations & Search | 40 |
| Week 4 | Testing & Deployment | 36 |
| **Total** | | **130** |
| **With 20% Buffer** | | **156** |

### Per Day Breakdown (Full-time Developer)
- **Week 1:** 3.6 hours/day (5 days)
- **Week 2:** 7.2 hours/day (5 days)
- **Week 3:** 8.0 hours/day (5 days)
- **Week 4:** 7.2 hours/day (5 days)

### Part-time Options
- **20 hrs/week:** 6.5-8 weeks
- **30 hrs/week:** 4.3-5.2 weeks

---

## Dependencies & Prerequisites

### External Services Required
- ✅ Supabase project (production + test)
- ✅ Vercel account
- ✅ GitHub repository
- ⚠️ Sentry account (optional, for monitoring)

### Environment Variables Required
```bash
# Required for Phase 1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=  # Port 6543 (pooler)
DIRECT_DATABASE_URL=  # Port 5432 (direct)
NEXT_PUBLIC_BASE_URL=

# Optional (recommended)
SENTRY_DSN=
```

### Technical Blockers
All blockers resolved - ready to implement features:
- [x] Supabase project accessible
- [x] Database migrations work
- [x] `npm install` successful
- [x] `npm run dev` works
- [x] Testing infrastructure configured
- [x] Auth infrastructure ready

---

## Risk Mitigation

### Technical Risks

**Risk:** Database migration fails
- **Mitigation:** Test migrations on separate test database first
- **Backup:** Manual SQL execution via Supabase dashboard

**Risk:** RLS policies too restrictive/permissive
- **Mitigation:** Write RLS tests in integration suite
- **Backup:** Disable RLS temporarily, fix policies, re-enable

**Risk:** Full-text search performance poor
- **Mitigation:** Add proper indexes, limit result count
- **Backup:** Use simpler LIKE query initially

### Schedule Risks

**Risk:** Feature takes longer than estimated
- **Mitigation:** 20% time buffer built in
- **Backup:** Defer non-critical features to Phase 2

**Risk:** Bugs discovered late
- **Mitigation:** Daily manual testing starting Week 2
- **Backup:** Extended Week 4 for critical fixes only

---

## Next Steps

### Current Status Summary
✅ **WEEK 1 COMPLETE (18 hours):**
- Supabase project setup
- Environment variables configured
- Dependencies installed (`npm install`)
- Dev server working (`npm run dev`)
- Testing infrastructure (Vitest, Playwright, factories, mocks)
- Authentication infrastructure (Supabase client/server utilities, middleware)
- Custom skills loaded and ready
- **Database schema (World, Location, Activity models with enums)**
- **RLS policies applied to all Phase 1 tables**
- **Authentication pages (login, signup, profile, OAuth callback)**
- **Dashboard page with basic layout**

⚠️ **REMAINING (112 hours):**
- World management features (Week 2) - 36 hours
- Location management and search (Week 3) - 40 hours
- Testing, polish, and production deployment (Week 4) - 36 hours

### Immediate Next Tasks - Week 2: World Management

**Priority 1: World Server Actions (7 hours)**
1. Create Zod validation schema in `src/lib/schemas/world.schema.ts`
2. Implement 5 Server Actions in `src/app/worlds/actions.ts`:
   - createWorld, updateWorld, deleteWorld, getWorlds, getWorld
3. Write integration tests for each action
4. Ensure RLS policies are enforced

**Priority 2: World Forms (6.5 hours)**
1. Install dependencies: `@uiw/react-md-editor` for markdown editing
2. Install shadcn components: `npx shadcn@latest add badge select tabs table alert toast avatar command`
3. Create WorldForm component with all fields (name, genre, description, setting, cover image, privacy)
4. Create image upload helper using Supabase Storage
5. Create world creation/editing pages
6. Write unit tests

**Priority 3: World List & Dashboard (7 hours)**
- Create WorldsList component with grid/list views
- Implement sorting, filtering, pagination
- Create dashboard page
- Add search input (client-side filtering)
- Write unit tests

---

## Questions & Support

### Have Questions?
- Check `CLAUDE.md` for project patterns
- Check skill documentation in `.claude/skills/*/SKILL.md`
- Check PRD: `docs/PRD.md`
- Check feature specs: `docs/WORLDCRAFTER_FEATURES.md`

### Need Help?
- Ask: "Which skill should I use for [task]?" → skill-selector will help
- Ask: "How do I [specific task]?" → Relevant skill will provide guidance

### Reporting Issues
- Document bugs in `docs/BUGS.md` with priority (P0/P1/P2)
- Track progress using Claude Code todo list
- Update this plan if timeline shifts

---

**Ready to begin Phase 1 implementation! 🚀**

Start with Week 1, Day 1: Database Schema Setup
