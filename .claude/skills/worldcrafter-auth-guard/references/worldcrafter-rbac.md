# WorldCrafter Role-Based Access Control (RBAC)

Complete guide to implementing role-based access control in WorldCrafter applications.

## Overview

WorldCrafter RBAC provides fine-grained permission control for collaborative world-building. The system supports five hierarchical roles with specific permissions for world management, content creation, and team collaboration.

## Role Hierarchy

```
OWNER (Level 5)
  └─ Full control over world and all resources
     └─ Can delete world, transfer ownership, manage billing

ADMIN (Level 4)
  └─ Manage world settings and all members
     └─ Can add/remove members, change roles (except OWNER)

EDITOR (Level 3)
  └─ Create and edit all content
     └─ Can create/edit/delete entities, locations, events

COMMENTER (Level 2)
  └─ View content and leave comments
     └─ Can comment on entities and suggest changes

VIEWER (Level 1)
  └─ Read-only access
     └─ Can view world content but cannot modify
```

## Database Schema

### WorldMember Table

Add this model to your `prisma/schema.prisma`:

```prisma
model World {
  id          String        @id @default(cuid())
  name        String
  description String?
  slug        String        @unique
  ownerId     String
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  owner       User          @relation("WorldOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     WorldMember[]
  entities    Entity[]

  @@map("worlds")
}

model WorldMember {
  id        String         @id @default(cuid())
  worldId   String         @map("world_id")
  userId    String         @map("user_id")
  role      WorldRole      @default(VIEWER)
  joinedAt  DateTime       @default(now()) @map("joined_at")
  updatedAt DateTime       @updatedAt @map("updated_at")

  world     World          @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([worldId, userId])
  @@index([userId])
  @@index([worldId, role])
  @@map("world_members")
}

enum WorldRole {
  VIEWER
  COMMENTER
  EDITOR
  ADMIN
  OWNER
}

model Entity {
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  name        String
  description String?
  type        String
  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)

  @@index([worldId])
  @@index([createdById])
  @@map("entities")
}
```

### Run Migrations

```bash
# Create migration
npx prisma migrate dev --name add_rbac_system

# Apply RLS policies
npm run db:rls
```

## Permission Matrix

| Action | VIEWER | COMMENTER | EDITOR | ADMIN | OWNER |
|--------|--------|-----------|--------|-------|-------|
| **World Management** |
| View world | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit world settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| Delete world | ❌ | ❌ | ❌ | ❌ | ✅ |
| Transfer ownership | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Content Management** |
| View entities | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create entities | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit own entities | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit others' entities | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete own entities | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete others' entities | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Collaboration** |
| Add comments | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit own comments | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete any comment | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Member Management** |
| View members | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remove members | ❌ | ❌ | ❌ | ✅ | ✅ |
| Change member roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Remove OWNER | ❌ | ❌ | ❌ | ❌ | ✅ |

## Helper Functions

### Core RBAC Helpers

Create `src/lib/rbac/permissions.ts`:

```typescript
import { WorldRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const ROLE_HIERARCHY: Record<WorldRole, number> = {
  VIEWER: 1,
  COMMENTER: 2,
  EDITOR: 3,
  ADMIN: 4,
  OWNER: 5,
}

/**
 * Get user's role in a world
 */
export async function getUserRole(
  userId: string,
  worldId: string
): Promise<WorldRole | null> {
  const membership = await prisma.worldMember.findUnique({
    where: {
      worldId_userId: {
        worldId,
        userId,
      },
    },
    select: { role: true },
  })

  return membership?.role || null
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  userRole: WorldRole,
  requiredRole: WorldRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can perform action in world
 */
export async function canPerformAction(
  userId: string,
  worldId: string,
  requiredRole: WorldRole
): Promise<boolean> {
  const userRole = await getUserRole(userId, worldId)
  if (!userRole) return false

  return hasMinimumRole(userRole, requiredRole)
}

/**
 * Require minimum role or throw error
 */
export async function requireRole(
  userId: string,
  worldId: string,
  requiredRole: WorldRole
): Promise<WorldRole> {
  const userRole = await getUserRole(userId, worldId)

  if (!userRole) {
    throw new Error('User is not a member of this world')
  }

  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new Error(`Requires ${requiredRole} role or higher`)
  }

  return userRole
}
```

### Permission Check Functions

Create `src/lib/rbac/checks.ts`:

```typescript
import { WorldRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getUserRole, hasMinimumRole } from './permissions'

/**
 * Check if user can edit entity
 * Editors can edit any entity, Commenters/Viewers cannot
 */
export async function canEditEntity(
  userId: string,
  worldId: string,
  entityId?: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  // EDITOR, ADMIN, OWNER can edit any entity
  if (hasMinimumRole(role, WorldRole.EDITOR)) {
    return true
  }

  return false
}

/**
 * Check if user can delete entity
 * Admins can delete any entity, Editors can delete own entities
 */
export async function canDeleteEntity(
  userId: string,
  worldId: string,
  entityId: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  // ADMIN and OWNER can delete any entity
  if (hasMinimumRole(role, WorldRole.ADMIN)) {
    return true
  }

  // EDITOR can delete own entities
  if (role === WorldRole.EDITOR) {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { createdById: true },
    })

    return entity?.createdById === userId
  }

  return false
}

/**
 * Check if user can manage world members
 * Only ADMIN and OWNER can manage members
 */
export async function canManageMembers(
  userId: string,
  worldId: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  return hasMinimumRole(role, WorldRole.ADMIN)
}

/**
 * Check if user can change member role
 * ADMIN can change roles up to ADMIN, OWNER can change any role
 */
export async function canChangeMemberRole(
  userId: string,
  worldId: string,
  targetRole: WorldRole
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  // OWNER can change any role
  if (role === WorldRole.OWNER) {
    return true
  }

  // ADMIN can change roles up to ADMIN (not OWNER)
  if (role === WorldRole.ADMIN && targetRole !== WorldRole.OWNER) {
    return true
  }

  return false
}

/**
 * Check if user can delete world
 * Only OWNER can delete world
 */
export async function canDeleteWorld(
  userId: string,
  worldId: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  return role === WorldRole.OWNER
}

/**
 * Check if user can edit world settings
 * ADMIN and OWNER can edit settings
 */
export async function canEditWorldSettings(
  userId: string,
  worldId: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  return hasMinimumRole(role, WorldRole.ADMIN)
}

/**
 * Check if user can add comments
 * COMMENTER and above can comment
 */
export async function canComment(
  userId: string,
  worldId: string
): Promise<boolean> {
  const role = await getUserRole(userId, worldId)
  if (!role) return false

  return hasMinimumRole(role, WorldRole.COMMENTER)
}
```

## Server Action Examples

### Protect Entity Creation

```typescript
"use server"

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac/permissions'
import { WorldRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function createEntity(worldId: string, data: EntityData) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Check permissions (requires EDITOR role)
  try {
    await requireRole(user.id, worldId, WorldRole.EDITOR)
  } catch (error) {
    return { success: false, error: 'Insufficient permissions' }
  }

  // 3. Create entity
  const entity = await prisma.entity.create({
    data: {
      ...data,
      worldId,
      createdById: user.id,
    },
  })

  revalidatePath(`/worlds/${worldId}`)
  return { success: true, data: entity }
}
```

### Protect Entity Deletion

```typescript
"use server"

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { canDeleteEntity } from '@/lib/rbac/checks'
import { revalidatePath } from 'next/cache'

export async function deleteEntity(worldId: string, entityId: string) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Check permissions
  const canDelete = await canDeleteEntity(user.id, worldId, entityId)
  if (!canDelete) {
    return { success: false, error: 'Insufficient permissions to delete this entity' }
  }

  // 3. Delete entity
  await prisma.entity.delete({ where: { id: entityId } })

  revalidatePath(`/worlds/${worldId}`)
  return { success: true }
}
```

### Protect Member Management

```typescript
"use server"

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { canManageMembers, canChangeMemberRole } from '@/lib/rbac/checks'
import { WorldRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function addMember(
  worldId: string,
  userId: string,
  role: WorldRole = WorldRole.VIEWER
) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Check permissions
  const canManage = await canManageMembers(user.id, worldId)
  if (!canManage) {
    return { success: false, error: 'Insufficient permissions to manage members' }
  }

  // 3. Check if can assign this role
  const canAssignRole = await canChangeMemberRole(user.id, worldId, role)
  if (!canAssignRole) {
    return { success: false, error: `Cannot assign ${role} role` }
  }

  // 4. Add member
  const member = await prisma.worldMember.create({
    data: {
      worldId,
      userId,
      role,
    },
  })

  revalidatePath(`/worlds/${worldId}/members`)
  return { success: true, data: member }
}

export async function updateMemberRole(
  worldId: string,
  userId: string,
  newRole: WorldRole
) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Check permissions
  const canChange = await canChangeMemberRole(user.id, worldId, newRole)
  if (!canChange) {
    return { success: false, error: 'Insufficient permissions to change this role' }
  }

  // 3. Update role
  const member = await prisma.worldMember.update({
    where: {
      worldId_userId: {
        worldId,
        userId,
      },
    },
    data: { role: newRole },
  })

  revalidatePath(`/worlds/${worldId}/members`)
  return { success: true, data: member }
}
```

## Row-Level Security (RLS) Policies

Create `prisma/migrations/sql/rls_rbac.sql`:

```sql
-- Enable RLS on worlds table
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Enable RLS on world_members table
ALTER TABLE world_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on entities table
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- Worlds: Users can read worlds they are members of
CREATE POLICY "Users can read member worlds"
ON worlds FOR SELECT
USING (
  id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
  )
);

-- Worlds: Only owners can update world settings
CREATE POLICY "Only owners can update worlds"
ON worlds FOR UPDATE
USING (owner_id = auth.uid());

-- Worlds: Only owners can delete worlds
CREATE POLICY "Only owners can delete worlds"
ON worlds FOR DELETE
USING (owner_id = auth.uid());

-- WorldMembers: Users can read members of worlds they belong to
CREATE POLICY "Users can read world members"
ON world_members FOR SELECT
USING (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
  )
);

-- WorldMembers: Only admins and owners can add members
CREATE POLICY "Admins can add members"
ON world_members FOR INSERT
WITH CHECK (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- WorldMembers: Only admins and owners can update member roles
CREATE POLICY "Admins can update member roles"
ON world_members FOR UPDATE
USING (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
);

-- Entities: Users can read entities in worlds they are members of
CREATE POLICY "Users can read world entities"
ON entities FOR SELECT
USING (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
  )
);

-- Entities: Editors and above can create entities
CREATE POLICY "Editors can create entities"
ON entities FOR INSERT
WITH CHECK (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
    AND role IN ('EDITOR', 'ADMIN', 'OWNER')
  )
);

-- Entities: Editors can update any entity, others cannot
CREATE POLICY "Editors can update entities"
ON entities FOR UPDATE
USING (
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
    AND role IN ('EDITOR', 'ADMIN', 'OWNER')
  )
);

-- Entities: Admins can delete any, Editors can delete own
CREATE POLICY "Admins can delete any entity, Editors own entities"
ON entities FOR DELETE
USING (
  -- Admins and owners can delete any
  world_id IN (
    SELECT world_id FROM world_members
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'OWNER')
  )
  OR
  -- Editors can delete their own
  (
    created_by_id = auth.uid()
    AND world_id IN (
      SELECT world_id FROM world_members
      WHERE user_id = auth.uid()
      AND role = 'EDITOR'
    )
  )
);
```

Apply RLS policies:

```bash
npm run db:rls
```

## UI Components

### Role Badge Component

Create `src/components/rbac/RoleBadge.tsx`:

```typescript
import { WorldRole } from '@prisma/client'
import { Badge } from '@/components/ui/badge'

const ROLE_CONFIG = {
  OWNER: { color: 'bg-purple-500', label: 'Owner' },
  ADMIN: { color: 'bg-red-500', label: 'Admin' },
  EDITOR: { color: 'bg-blue-500', label: 'Editor' },
  COMMENTER: { color: 'bg-green-500', label: 'Commenter' },
  VIEWER: { color: 'bg-gray-500', label: 'Viewer' },
}

interface RoleBadgeProps {
  role: WorldRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]

  return (
    <Badge className={config.color}>
      {config.label}
    </Badge>
  )
}
```

### Role Selector Component

Create `src/components/rbac/RoleSelector.tsx`:

```typescript
'use client'

import { WorldRole } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RoleSelectorProps {
  value: WorldRole
  onChange: (role: WorldRole) => void
  maxRole?: WorldRole // Maximum role this user can assign
}

export function RoleSelector({ value, onChange, maxRole = WorldRole.OWNER }: RoleSelectorProps) {
  const roles = [
    { value: WorldRole.VIEWER, label: 'Viewer - Read only' },
    { value: WorldRole.COMMENTER, label: 'Commenter - Can comment' },
    { value: WorldRole.EDITOR, label: 'Editor - Can edit content' },
    { value: WorldRole.ADMIN, label: 'Admin - Can manage members' },
    { value: WorldRole.OWNER, label: 'Owner - Full control' },
  ]

  const ROLE_HIERARCHY: Record<WorldRole, number> = {
    VIEWER: 1,
    COMMENTER: 2,
    EDITOR: 3,
    ADMIN: 4,
    OWNER: 5,
  }

  const availableRoles = roles.filter(
    (role) => ROLE_HIERARCHY[role.value] <= ROLE_HIERARCHY[maxRole]
  )

  return (
    <Select value={value} onValueChange={(value) => onChange(value as WorldRole)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### Conditional Rendering Based on Permissions

Create `src/components/rbac/Can.tsx`:

```typescript
'use client'

import { WorldRole } from '@prisma/client'
import { ReactNode } from 'react'

interface CanProps {
  userRole: WorldRole
  minimumRole: WorldRole
  children: ReactNode
  fallback?: ReactNode
}

const ROLE_HIERARCHY: Record<WorldRole, number> = {
  VIEWER: 1,
  COMMENTER: 2,
  EDITOR: 3,
  ADMIN: 4,
  OWNER: 5,
}

export function Can({ userRole, minimumRole, children, fallback = null }: CanProps) {
  const hasPermission = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole]

  return hasPermission ? <>{children}</> : <>{fallback}</>
}
```

Usage example:

```typescript
<Can userRole={currentUserRole} minimumRole={WorldRole.EDITOR}>
  <Button>Create Entity</Button>
</Can>
```

## Testing RBAC

### Unit Tests

Create `src/lib/rbac/__tests__/permissions.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { WorldRole } from '@prisma/client'
import { getUserRole, hasMinimumRole, canPerformAction } from '../permissions'

describe('RBAC Permissions', () => {
  let worldId: string
  let userId: string

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        id: 'test-user',
        email: 'test@example.com',
      },
    })
    userId = user.id

    // Create test world
    const world = await prisma.world.create({
      data: {
        name: 'Test World',
        slug: 'test-world',
        ownerId: userId,
      },
    })
    worldId = world.id
  })

  afterEach(async () => {
    await prisma.worldMember.deleteMany()
    await prisma.world.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should return user role', async () => {
    await prisma.worldMember.create({
      data: {
        worldId,
        userId,
        role: WorldRole.EDITOR,
      },
    })

    const role = await getUserRole(userId, worldId)
    expect(role).toBe(WorldRole.EDITOR)
  })

  it('should check minimum role correctly', () => {
    expect(hasMinimumRole(WorldRole.ADMIN, WorldRole.EDITOR)).toBe(true)
    expect(hasMinimumRole(WorldRole.EDITOR, WorldRole.ADMIN)).toBe(false)
    expect(hasMinimumRole(WorldRole.EDITOR, WorldRole.EDITOR)).toBe(true)
  })

  it('should verify user can perform action', async () => {
    await prisma.worldMember.create({
      data: {
        worldId,
        userId,
        role: WorldRole.ADMIN,
      },
    })

    const canPerform = await canPerformAction(userId, worldId, WorldRole.EDITOR)
    expect(canPerform).toBe(true)
  })
})
```

### Integration Tests

Create `src/app/__tests__/rbac.integration.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEntity, deleteEntity } from '@/app/worlds/[worldId]/entities/actions'
import { prisma } from '@/lib/prisma'
import { WorldRole } from '@prisma/client'

describe('RBAC Integration Tests', () => {
  let worldId: string
  let editorId: string
  let viewerId: string

  beforeEach(async () => {
    // Create test data
    const editor = await prisma.user.create({
      data: { id: 'editor', email: 'editor@example.com' },
    })
    const viewer = await prisma.user.create({
      data: { id: 'viewer', email: 'viewer@example.com' },
    })

    editorId = editor.id
    viewerId = viewer.id

    const world = await prisma.world.create({
      data: {
        name: 'Test World',
        slug: 'test',
        ownerId: editorId,
        members: {
          create: [
            { userId: editorId, role: WorldRole.EDITOR },
            { userId: viewerId, role: WorldRole.VIEWER },
          ],
        },
      },
    })
    worldId = world.id
  })

  afterEach(async () => {
    await prisma.entity.deleteMany()
    await prisma.worldMember.deleteMany()
    await prisma.world.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should allow editor to create entity', async () => {
    const result = await createEntity(worldId, {
      name: 'Test Entity',
      type: 'character',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('should prevent viewer from creating entity', async () => {
    // Mock as viewer user
    const result = await createEntity(worldId, {
      name: 'Test Entity',
      type: 'character',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Insufficient permissions')
  })
})
```

## Best Practices

1. **Always check permissions on server**
   - Never trust client-side permission checks
   - Always verify role in Server Actions

2. **Use RLS as second layer**
   - Database-level protection prevents data leaks
   - Application-level checks provide better UX

3. **Verify both authentication and authorization**
   - Check user is logged in (authentication)
   - Check user has required role (authorization)

4. **Handle permission errors gracefully**
   - Return clear error messages
   - Don't expose sensitive information

5. **Test all permission scenarios**
   - Test each role can/cannot perform actions
   - Test edge cases (no membership, etc.)

6. **Use helper functions**
   - Centralize permission logic
   - Reuse across Server Actions

7. **Cache role checks when possible**
   - Avoid repeated database queries
   - Use context/state for client components

## Common Patterns

### Page Protection with Role Check

```typescript
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/rbac/permissions'
import { WorldRole } from '@prisma/client'
import { redirect } from 'next/navigation'

export default async function WorldSettingsPage({
  params,
}: {
  params: { worldId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    await requireRole(user.id, params.worldId, WorldRole.ADMIN)
  } catch {
    redirect(`/worlds/${params.worldId}`)
  }

  return <div>World Settings</div>
}
```

### Conditional UI Rendering

```typescript
import { getUserRole } from '@/lib/rbac/permissions'
import { WorldRole } from '@prisma/client'
import { Can } from '@/components/rbac/Can'

export default async function WorldPage({ params }: { params: { worldId: string } }) {
  const user = await getUser()
  const role = await getUserRole(user.id, params.worldId)

  return (
    <div>
      <h1>World</h1>

      <Can userRole={role} minimumRole={WorldRole.EDITOR}>
        <Button>Create Entity</Button>
      </Can>

      <Can userRole={role} minimumRole={WorldRole.ADMIN}>
        <Button>Manage Members</Button>
      </Can>
    </div>
  )
}
```

## Troubleshooting

### Common Issues

**Issue**: User has role but cannot perform action
- **Solution**: Check RLS policies are applied, verify role hierarchy

**Issue**: Permission checks slow down application
- **Solution**: Cache role in React Context or session

**Issue**: Cannot assign OWNER role
- **Solution**: OWNER role should only be assigned via transfer ownership, not general role change

**Issue**: RLS policies blocking legitimate actions
- **Solution**: Review policy logic, ensure auth.uid() is set correctly
