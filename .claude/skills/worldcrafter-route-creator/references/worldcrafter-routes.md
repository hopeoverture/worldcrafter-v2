# WorldCrafter Route Structure

Complete route tree for the WorldCrafter application with all pages, API endpoints, and special route patterns.

## Application Route Tree

```
src/app/
├── (auth)/                          # Auth route group (shared layout)
│   ├── login/
│   │   └── page.tsx                 # /login - Sign in page
│   ├── signup/
│   │   └── page.tsx                 # /signup - Registration page
│   └── reset-password/
│       └── page.tsx                 # /reset-password - Password recovery
│
├── (marketing)/                     # Marketing route group (public)
│   ├── page.tsx                     # / - Landing page
│   ├── about/
│   │   └── page.tsx                 # /about - About WorldCrafter
│   └── pricing/
│       └── page.tsx                 # /pricing - Pricing plans
│
├── worlds/                          # World management
│   ├── page.tsx                     # /worlds - List all user's worlds
│   ├── new/
│   │   └── page.tsx                 # /worlds/new - Create new world
│   └── [slug]/                      # Dynamic world routes
│       ├── page.tsx                 # /worlds/:slug - World dashboard
│       ├── settings/
│       │   └── page.tsx             # /worlds/:slug/settings - World settings
│       │
│       ├── characters/              # Character management
│       │   ├── page.tsx             # /worlds/:slug/characters - List characters
│       │   ├── new/
│       │   │   └── page.tsx         # /worlds/:slug/characters/new - Create character
│       │   └── [id]/
│       │       ├── page.tsx         # /worlds/:slug/characters/:id - Character detail
│       │       └── edit/
│       │           └── page.tsx     # /worlds/:slug/characters/:id/edit - Edit character
│       │
│       ├── locations/               # Location management
│       │   ├── page.tsx             # /worlds/:slug/locations - List locations
│       │   ├── new/
│       │   │   └── page.tsx         # /worlds/:slug/locations/new - Create location
│       │   └── [id]/
│       │       ├── page.tsx         # /worlds/:slug/locations/:id - Location detail
│       │       └── edit/
│       │           └── page.tsx     # /worlds/:slug/locations/:id/edit - Edit location
│       │
│       ├── events/                  # Event management
│       │   ├── page.tsx             # /worlds/:slug/events - List events
│       │   ├── new/
│       │   │   └── page.tsx         # /worlds/:slug/events/new - Create event
│       │   └── [id]/
│       │       ├── page.tsx         # /worlds/:slug/events/:id - Event detail
│       │       └── edit/
│       │           └── page.tsx     # /worlds/:slug/events/:id/edit - Edit event
│       │
│       ├── items/                   # Item/artifact management
│       │   ├── page.tsx             # /worlds/:slug/items - List items
│       │   ├── new/
│       │   │   └── page.tsx         # /worlds/:slug/items/new - Create item
│       │   └── [id]/
│       │       ├── page.tsx         # /worlds/:slug/items/:id - Item detail
│       │       └── edit/
│       │           └── page.tsx     # /worlds/:slug/items/:id/edit - Edit item
│       │
│       ├── factions/                # Faction/organization management
│       │   ├── page.tsx             # /worlds/:slug/factions - List factions
│       │   ├── new/
│       │   │   └── page.tsx         # /worlds/:slug/factions/new - Create faction
│       │   └── [id]/
│       │       ├── page.tsx         # /worlds/:slug/factions/:id - Faction detail
│       │       └── edit/
│       │           └── page.tsx     # /worlds/:slug/factions/:id/edit - Edit faction
│       │
│       ├── graph/
│       │   └── page.tsx             # /worlds/:slug/graph - Relationship graph visualization
│       │
│       ├── map/
│       │   └── page.tsx             # /worlds/:slug/map - Interactive world map
│       │
│       ├── timeline/
│       │   └── page.tsx             # /worlds/:slug/timeline - Events timeline
│       │
│       └── wiki/                    # World wiki
│           ├── page.tsx             # /worlds/:slug/wiki - Wiki home
│           └── [pageSlug]/
│               └── page.tsx         # /worlds/:slug/wiki/:pageSlug - Wiki page
│
├── explore/
│   └── page.tsx                     # /explore - Public world gallery
│
└── api/                             # API routes
    ├── upload/
    │   └── route.ts                 # POST /api/upload - File upload to Supabase Storage
    │
    ├── export/
    │   └── route.ts                 # POST /api/export - World export (background job)
    │
    ├── mcp/
    │   └── route.ts                 # POST /api/mcp - MCP server (JSON-RPC 2.0)
    │
    ├── sse/
    │   └── activity/
    │       └── route.ts             # GET /api/sse/activity - Server-Sent Events for activity stream
    │
    └── webhooks/
        └── stripe/
            └── route.ts             # POST /api/webhooks/stripe - Stripe webhook handler
```

## Route Patterns by Type

### Public Routes (No Auth Required)

```typescript
// Landing page
src/app/(marketing)/page.tsx

// About page
src/app/(marketing)/about/page.tsx

// Pricing page
src/app/(marketing)/pricing/page.tsx

// Public gallery
src/app/explore/page.tsx
```

**Pattern:**
- Use route group `(marketing)` for shared marketing layout
- No auth checks needed
- SEO metadata important
- Server-rendered for performance

### Authentication Routes

```typescript
// Login
src/app/(auth)/login/page.tsx

// Signup
src/app/(auth)/signup/page.tsx

// Password reset
src/app/(auth)/reset-password/page.tsx
```

**Pattern:**
- Use route group `(auth)` for shared auth layout
- Redirect authenticated users to dashboard
- Client components for form interactivity
- Server Actions for auth operations

### Protected Routes (Auth Required)

```typescript
// All routes under /worlds require authentication
src/app/worlds/page.tsx              // World list
src/app/worlds/[slug]/page.tsx       // World dashboard
src/app/worlds/[slug]/characters/page.tsx  // Character list
```

**Pattern:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Page content
}
```

### Dynamic Routes

#### World Slug Routes

```typescript
// World dashboard
src/app/worlds/[slug]/page.tsx

// Access world slug
export default function WorldPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  // Fetch world by slug
}
```

#### Entity ID Routes

```typescript
// Character detail
src/app/worlds/[slug]/characters/[id]/page.tsx

// Access both params
export default function CharacterPage({
  params
}: {
  params: { slug: string; id: string }
}) {
  const { slug, id } = params
  // Fetch world by slug, character by id
}
```

**Pattern:**
- Use `[slug]` for human-readable world identifiers
- Use `[id]` for entity primary keys (UUID/CUID)
- Add `not-found.tsx` for invalid params
- Use `generateStaticParams` for static generation

### API Routes

#### File Upload (Multipart)

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(`${user.id}/${file.name}`, file)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ url: data.path })
}
```

#### Export (Background Job)

```typescript
// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { worldId } = await request.json()

  // Create export job
  const job = await prisma.exportJob.create({
    data: {
      userId: user.id,
      worldId,
      status: 'pending'
    }
  })

  // Trigger background export (e.g., queue system)
  // await queueExportJob(job.id)

  return NextResponse.json({ jobId: job.id })
}
```

#### MCP Server (JSON-RPC 2.0)

```typescript
// src/app/api/mcp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: unknown
  id: string | number
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized' },
      id: null
    }, { status: 401 })
  }

  const rpcRequest: JsonRpcRequest = await request.json()

  try {
    // Route to appropriate handler
    const result = await handleMcpMethod(rpcRequest.method, rpcRequest.params, user.id)

    return NextResponse.json({
      jsonrpc: '2.0',
      result,
      id: rpcRequest.id
    })
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error'
      },
      id: rpcRequest.id
    }, { status: 500 })
  }
}

async function handleMcpMethod(method: string, params: unknown, userId: string) {
  switch (method) {
    case 'worlds.list':
      return prisma.world.findMany({ where: { userId } })
    case 'characters.list':
      const { worldId } = params as { worldId: string }
      return prisma.character.findMany({ where: { worldId, world: { userId } } })
    default:
      throw new Error(`Unknown method: ${method}`)
  }
}
```

#### Server-Sent Events (SSE)

```typescript
// src/app/api/sse/activity/route.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      // Subscribe to real-time updates
      const channel = supabase
        .channel('activity')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
            )
          }
        )
        .subscribe()

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        channel.unsubscribe()
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

#### Webhook Handler (Stripe)

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      await prisma.subscription.create({
        data: {
          userId: session.metadata!.userId,
          stripeSubscriptionId: session.subscription as string,
          status: 'active'
        }
      })
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' }
      })
      break
  }

  return NextResponse.json({ received: true })
}
```

## WorldCrafter-Specific Patterns

### World Dashboard Pattern

```typescript
// src/app/worlds/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'

export default async function WorldDashboard({
  params
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch world with RLS enforcement
  const world = await prisma.world.findFirst({
    where: {
      slug: params.slug,
      userId: user.id  // RLS ensures this
    },
    include: {
      _count: {
        select: {
          characters: true,
          locations: true,
          events: true,
          items: true
        }
      }
    }
  })

  if (!world) notFound()

  return (
    <div>
      <h1>{world.name}</h1>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Characters" count={world._count.characters} />
        <StatCard label="Locations" count={world._count.locations} />
        <StatCard label="Events" count={world._count.events} />
        <StatCard label="Items" count={world._count.items} />
      </div>
    </div>
  )
}
```

### Entity List Pattern

```typescript
// src/app/worlds/[slug]/characters/page.tsx
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CharactersList({
  params
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify world ownership
  const world = await prisma.world.findFirst({
    where: { slug: params.slug, userId: user.id }
  })

  if (!world) notFound()

  // Fetch characters (RLS enforced)
  const characters = await prisma.character.findMany({
    where: { worldId: world.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Characters</h1>
        <Link href={`/worlds/${params.slug}/characters/new`}>
          Create Character
        </Link>
      </div>

      <div className="grid gap-4">
        {characters.map(character => (
          <Link
            key={character.id}
            href={`/worlds/${params.slug}/characters/${character.id}`}
          >
            <div className="border p-4 rounded hover:bg-muted">
              <h3>{character.name}</h3>
              <p className="text-sm text-muted-foreground">
                {character.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

### Entity Detail Pattern

```typescript
// src/app/worlds/[slug]/characters/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CharacterDetail({
  params
}: {
  params: { slug: string; id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch character with world ownership check
  const character = await prisma.character.findFirst({
    where: {
      id: params.id,
      world: {
        slug: params.slug,
        userId: user.id
      }
    },
    include: {
      world: true,
      relationships: {
        include: {
          relatedCharacter: true
        }
      }
    }
  })

  if (!character) notFound()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>{character.name}</h1>
        <Link href={`/worlds/${params.slug}/characters/${character.id}/edit`}>
          Edit
        </Link>
      </div>

      <div className="prose max-w-none">
        <p>{character.description}</p>

        <h2>Relationships</h2>
        <ul>
          {character.relationships.map(rel => (
            <li key={rel.id}>
              <Link href={`/worlds/${params.slug}/characters/${rel.relatedCharacterId}`}>
                {rel.relatedCharacter.name}
              </Link>
              {' - '}
              <span className="text-sm">{rel.type}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

## Route Groups and Layouts

### Marketing Layout

```typescript
// src/app/(marketing)/layout.tsx
import Link from 'next/link'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto flex justify-between items-center py-4">
          <Link href="/" className="font-bold text-xl">WorldCrafter</Link>
          <div className="flex gap-4">
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Login</Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2025 WorldCrafter. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
```

### World Layout (Nested)

```typescript
// src/app/worlds/[slug]/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function WorldLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const world = await prisma.world.findFirst({
    where: { slug: params.slug, userId: user.id }
  })

  if (!world) notFound()

  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-muted/10">
        <div className="p-4">
          <h2 className="font-bold mb-4">{world.name}</h2>
          <nav className="space-y-2">
            <Link href={`/worlds/${params.slug}`}>Dashboard</Link>
            <Link href={`/worlds/${params.slug}/characters`}>Characters</Link>
            <Link href={`/worlds/${params.slug}/locations`}>Locations</Link>
            <Link href={`/worlds/${params.slug}/events`}>Events</Link>
            <Link href={`/worlds/${params.slug}/items`}>Items</Link>
            <Link href={`/worlds/${params.slug}/factions`}>Factions</Link>
            <Link href={`/worlds/${params.slug}/graph`}>Graph</Link>
            <Link href={`/worlds/${params.slug}/map`}>Map</Link>
            <Link href={`/worlds/${params.slug}/timeline`}>Timeline</Link>
            <Link href={`/worlds/${params.slug}/wiki`}>Wiki</Link>
            <Link href={`/worlds/${params.slug}/settings`}>Settings</Link>
          </nav>
        </div>
      </aside>

      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
```

## Best Practices

### Route Security

1. Always check authentication in protected routes
2. Verify world ownership for all world/* routes
3. Use RLS policies for database-level security
4. Validate params before database queries

### Route Performance

1. Use Server Components by default
2. Implement Suspense boundaries with loading.tsx
3. Prefetch related data in parallel
4. Use `generateStaticParams` for static generation

### Route Organization

1. Use route groups for shared layouts
2. Colocate components with routes
3. Keep route files focused on data fetching
4. Extract business logic to utilities

### Error Handling

1. Add error.tsx at appropriate levels
2. Add not-found.tsx for dynamic routes
3. Return appropriate HTTP status codes in API routes
4. Log errors for monitoring
