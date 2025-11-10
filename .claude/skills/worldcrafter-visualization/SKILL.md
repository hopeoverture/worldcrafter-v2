# WorldCrafter Visualization Skill

**Version:** 1.0.0

**Description:** Create interactive visualizations for world-building data including maps, timelines, relationship graphs, family trees, organizational charts, and analytics dashboards. Supports data export, real-time updates, and integration with WorldCrafter's entity system.

**Trigger Phrases:**
- "upload map", "create map", "interactive map"
- "show timeline", "visualize timeline", "event timeline"
- "visualize graph", "relationship graph", "show connections"
- "family tree", "genealogy chart"
- "org chart", "organization chart", "faction hierarchy"
- "display analytics", "show dashboard", "world statistics"

**Allowed Tools:** Read, Write, Edit, Bash, Glob, Grep

**Related Skills:**
- database-setup
- feature-builder
- test-generator

---

## Overview

This skill provides comprehensive visualization capabilities for WorldCrafter data:

1. **Interactive Maps** - Upload map images, place markers, draw routes
2. **Timeline Visualizations** - Display events on scrollable timelines
3. **Relationship Graphs** - Visualize entity connections and relationships
4. **Family Trees** - Generate genealogy charts from character relationships
5. **Organizational Charts** - Display faction hierarchies
6. **Analytics Dashboards** - Show world statistics and insights

All visualizations support:
- Real-time data updates via TanStack Query
- Export to PNG/SVG/PDF
- Responsive design (desktop/tablet/mobile)
- Dark mode support
- Accessibility (ARIA labels, keyboard navigation)

---

## Installation

### Required Dependencies

```bash
# Map visualization
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Timeline visualization
npm install vis-timeline vis-data

# Graph/network visualization
npm install @xyflow/react

# Tree visualization (family trees, org charts)
npm install d3

# Charts and analytics
npm install recharts

# Export functionality
npm install html2canvas jspdf

# Supabase Storage (for map images)
npm install @supabase/storage-js
```

### TypeScript Configuration

Add to `tsconfig.json` compiler options if needed:

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

---

## 1. Interactive Map

### Overview

Upload custom world map images to Supabase Storage and add interactive markers, routes, and regions.

**Use Cases:**
- Fantasy world maps with city/landmark markers
- Historical maps with event locations
- Region boundaries and political territories
- Trade routes and travel paths

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
model WorldMap {
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  name        String
  description String?
  imageUrl    String   @map("image_url") // Supabase Storage URL
  width       Int      // Image width in pixels
  height      Int      // Image height in pixels
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  userId      String   @map("user_id")

  world       World         @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user        User          @relation(fields: [userId], references: [id])
  markers     MapMarker[]
  routes      MapRoute[]

  @@map("world_maps")
}

model MapMarker {
  id          String   @id @default(cuid())
  mapId       String   @map("map_id")
  locationId  String?  @map("location_id") // Optional link to Location entity
  name        String
  description String?
  x           Float    // X coordinate (0-100, percentage)
  y           Float    // Y coordinate (0-100, percentage)
  type        String   // city, landmark, battle, etc.
  icon        String?  // Custom icon identifier
  color       String   @default("#3b82f6")
  createdAt   DateTime @default(now()) @map("created_at")

  map         WorldMap  @relation(fields: [mapId], references: [id], onDelete: Cascade)
  location    Location? @relation(fields: [locationId], references: [id])

  @@map("map_markers")
}

model MapRoute {
  id          String   @id @default(cuid())
  mapId       String   @map("map_id")
  name        String
  description String?
  points      Json     // Array of {x, y} coordinates
  type        String   // route, border, river, etc.
  color       String   @default("#ef4444")
  width       Int      @default(2)
  createdAt   DateTime @default(now()) @map("created_at")

  map         WorldMap @relation(fields: [mapId], references: [id], onDelete: Cascade)

  @@map("map_routes")
}
```

### Implementation Steps

1. **Apply schema changes:**
```bash
npx prisma migrate dev --name add_map_visualization
npm run db:rls  # Apply RLS policies
```

2. **Create component:** Use template from `assets/templates/interactive-map.tsx`

3. **Add route:** Create `src/app/(protected)/worlds/[worldId]/maps/page.tsx`

4. **Configure Supabase Storage:**
```typescript
// In Supabase dashboard:
// Storage > Create bucket "world-maps"
// Set public: true
// Max file size: 10MB
// Allowed MIME types: image/png, image/jpeg, image/webp
```

### Usage Example

```typescript
// Upload map image
const file = event.target.files[0];
const supabase = await createClient();
const { data, error } = await supabase.storage
  .from('world-maps')
  .upload(`${worldId}/${Date.now()}-${file.name}`, file);

// Create map record
const mapUrl = supabase.storage.from('world-maps').getPublicUrl(data.path).data.publicUrl;
await createMap({
  worldId,
  name: "Middle Earth",
  imageUrl: mapUrl,
  width: 2048,
  height: 1536
});

// Add marker
await createMapMarker({
  mapId,
  name: "Rivendell",
  x: 45.5,  // 45.5% from left
  y: 32.0,  // 32% from top
  type: "city",
  locationId: "clx123..." // Optional
});
```

### Features

- **Pan & Zoom:** Mouse drag to pan, scroll wheel to zoom
- **Marker Types:** Predefined icons (city, mountain, forest, castle, etc.)
- **Custom Icons:** Upload custom SVG icons per marker
- **Routes:** Draw polylines for roads, rivers, borders
- **Distance Measurement:** Click points to measure distances
- **Export:** Download as PNG with current view/zoom
- **Responsive:** Works on mobile with touch gestures

---

## 2. Timeline Visualization

### Overview

Display events on an interactive horizontal timeline with flexible date parsing.

**Use Cases:**
- Historical events ("Battle of Waterloo - 1815")
- Fantasy calendars ("The Long Night - Year 342 of Third Age")
- Character life events ("Born 1453 BCE")
- World history spanning millennia

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
model Timeline {
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  name        String
  description String?
  dateFormat  String   @default("standard") @map("date_format") // standard, custom
  era         String?  // BCE/CE, custom era names
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  userId      String   @map("user_id")

  world       World          @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user        User           @relation(fields: [userId], references: [id])
  events      TimelineEvent[]

  @@map("timelines")
}

model TimelineEvent {
  id          String   @id @default(cuid())
  timelineId  String   @map("timeline_id")
  eventId     String?  @map("event_id") // Optional link to Event entity
  name        String
  description String?
  startDate   String   @map("start_date") // Flexible string format
  endDate     String?  @map("end_date")   // Optional for duration events
  type        String   // battle, birth, death, founding, etc.
  participants Json?   // Array of character/faction IDs
  locationId  String?  @map("location_id")
  color       String   @default("#3b82f6")
  createdAt   DateTime @default(now()) @map("created_at")

  timeline    Timeline  @relation(fields: [timelineId], references: [id], onDelete: Cascade)
  event       Event?    @relation(fields: [eventId], references: [id])
  location    Location? @relation(fields: [locationId], references: [id])

  @@map("timeline_events")
}
```

### Implementation Steps

1. **Apply schema changes:**
```bash
npx prisma migrate dev --name add_timeline_visualization
npm run db:rls
```

2. **Create component:** Use template from `assets/templates/timeline-view.tsx`

3. **Add route:** Create `src/app/(protected)/worlds/[worldId]/timeline/page.tsx`

### Usage Example

```typescript
// Create timeline
await createTimeline({
  worldId,
  name: "History of Westeros",
  dateFormat: "custom",
  era: "AC" // After Conquest
});

// Add events
await createTimelineEvent({
  timelineId,
  name: "Aegon's Conquest",
  startDate: "1 AC",
  endDate: "3 AC",
  type: "war",
  participants: ["aegon-targaryen", "torrhen-stark"],
  color: "#dc2626"
});

await createTimelineEvent({
  timelineId,
  name: "The Long Night",
  startDate: "8000 years before Aegon's Conquest",
  type: "catastrophe",
  color: "#1e293b"
});
```

### Features

- **Flexible Dates:** Parse "Year 342", "1453 BCE", "The Long Night", ISO dates
- **Zoom Levels:** Year, decade, century, millennium
- **Event Types:** Color-coded icons (war, birth, death, founding, etc.)
- **Filters:** By type, location, participants
- **Detail Popups:** Click event for full details
- **Navigation:** Click/drag to scroll, buttons for today/start/end
- **Export:** PNG screenshot of visible timeline section

### Date Parsing Strategy

```typescript
// Priority order:
// 1. ISO date string: "2024-01-15"
// 2. Year number: "342", "-1453" (negative = BCE)
// 3. Year with era: "342 AC", "1453 BCE"
// 4. Relative: "8000 years before X" (requires anchor event)
// 5. Named: "The Long Night" (requires date mapping table)

// Sort by normalized year value
// Display using original string format
```

---

## 3. Relationship Graph

### Overview

Visualize connections between entities (characters, locations, factions) as an interactive network graph.

**Use Cases:**
- Character relationships (family, allies, enemies)
- Faction alliances and rivalries
- Location connections (trade routes, political boundaries)
- Cross-entity relationships (character belongs to faction, lives in location)

### Database Schema

Uses existing `Relationship` model in WorldCrafter schema. No changes needed.

### Implementation Steps

1. **Create component:** Use template from `assets/templates/relationship-graph.tsx`

2. **Add route:** Create `src/app/(protected)/worlds/[worldId]/graph/page.tsx`

3. **Install dependencies:**
```bash
npm install @xyflow/react
```

### Usage Example

```typescript
// Fetch relationships
const relationships = await prisma.relationship.findMany({
  where: { worldId },
  include: {
    fromEntity: true,
    toEntity: true
  }
});

// Transform to graph format
const nodes = uniqueEntities.map(entity => ({
  id: entity.id,
  type: entity.type, // character, location, faction
  data: {
    label: entity.name,
    avatar: entity.imageUrl,
    type: entity.type
  },
  position: { x: 0, y: 0 } // Auto-layout
}));

const edges = relationships.map(rel => ({
  id: rel.id,
  source: rel.fromEntityId,
  target: rel.toEntityId,
  label: rel.type, // "parent-of", "ally", "enemy"
  type: rel.bidirectional ? 'default' : 'arrow'
}));
```

### Features

- **Force-Directed Layout:** Auto-arrange nodes to minimize edge crossings
- **Node Types:** Color-coded by entity type (characters = blue, locations = green, factions = red)
- **Edge Types:** Directional arrows, bidirectional lines, custom labels
- **Interactions:** Drag nodes, pan canvas, zoom in/out
- **Filters:** Show/hide entity types, relationship types
- **Selection:** Click node to highlight connected nodes
- **Detail Modal:** Click node to open entity detail modal
- **Export:** SVG or PNG of entire graph

### Layout Algorithms

```typescript
// Force-directed (default): Good for general networks
layout: 'force'

// Hierarchical: Good for org charts, family trees
layout: 'hierarchical'
direction: 'TB' // top-to-bottom

// Circular: Good for small networks
layout: 'circular'

// Grid: Good for structured data
layout: 'grid'
```

---

## 4. Family Tree

### Overview

Generate hierarchical family trees from parent-child relationships.

**Use Cases:**
- Character genealogy
- Royal lineages
- Multi-generational family structures

### Database Schema

Uses existing `Relationship` model with `type: "parent-of"` or `type: "child-of"`.

### Implementation Steps

1. **Create component:** Use template from `assets/templates/family-tree.tsx`

2. **Add route:** Create `src/app/(protected)/entities/[entityId]/family-tree/page.tsx`

3. **Install D3:**
```bash
npm install d3
npm install -D @types/d3
```

### Usage Example

```typescript
// Fetch family relationships
const relationships = await prisma.relationship.findMany({
  where: {
    worldId,
    type: { in: ['parent-of', 'child-of', 'spouse-of'] }
  },
  include: {
    fromEntity: true,
    toEntity: true
  }
});

// Build tree from root character
const tree = buildFamilyTree({
  rootId: characterId,
  relationships
});

// Render tree
<FamilyTree data={tree} />
```

### Features

- **Tree Layout:** Top-to-bottom, left-to-right, or radial
- **Character Portraits:** Display avatar images on nodes
- **Relationship Lines:** Parent-child (solid), spouse (dashed)
- **Expand/Collapse:** Click node to show/hide descendants
- **Multi-Marriage:** Handle characters with multiple spouses
- **Adoption:** Visual indicator for non-biological relationships
- **Export:** SVG or PNG of entire tree

### Tree Building Algorithm

```typescript
// 1. Find root character (oldest ancestor or specified)
// 2. Traverse parent-of relationships recursively
// 3. Group siblings by parent
// 4. Position spouses adjacent to each other
// 5. Calculate node positions using D3 tree layout
// 6. Draw connecting lines (parent-child, spouse)
```

---

## 5. Organizational Chart

### Overview

Display faction hierarchies and organizational structures.

**Use Cases:**
- Faction leadership chains
- Government structures
- Military hierarchies
- Corporate/guild organizations

### Database Schema

Add to `prisma/schema.prisma`:

```prisma
model FactionMembership {
  id          String   @id @default(cuid())
  factionId   String   @map("faction_id")
  characterId String   @map("character_id")
  role        String   // leader, member, officer, etc.
  title       String?  // Custom title (King, General, etc.)
  rank        Int      @default(0) // For hierarchical ordering
  reportsTo   String?  @map("reports_to") // ID of superior member
  createdAt   DateTime @default(now()) @map("created_at")

  faction     Faction   @relation(fields: [factionId], references: [id], onDelete: Cascade)
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  superior    FactionMembership? @relation("OrgHierarchy", fields: [reportsTo], references: [id])
  subordinates FactionMembership[] @relation("OrgHierarchy")

  @@unique([factionId, characterId])
  @@map("faction_memberships")
}
```

### Implementation Steps

1. **Apply schema changes:**
```bash
npx prisma migrate dev --name add_faction_hierarchy
npm run db:rls
```

2. **Create component:** Use template from `assets/templates/org-chart.tsx`

3. **Add route:** Create `src/app/(protected)/entities/[factionId]/org-chart/page.tsx`

### Usage Example

```typescript
// Create faction membership
await createFactionMembership({
  factionId: "night-watch",
  characterId: "jon-snow",
  role: "leader",
  title: "Lord Commander",
  rank: 1
});

await createFactionMembership({
  factionId: "night-watch",
  characterId: "samwell-tarly",
  role: "member",
  title: "Steward",
  rank: 3,
  reportsTo: "jon-snow-membership-id"
});

// Render org chart
<OrgChart factionId={factionId} />
```

### Features

- **Hierarchical Layout:** Top-down tree structure
- **Faction Emblem:** Display at root node
- **Member Cards:** Show portrait, name, title, rank
- **Expand/Collapse:** Click node to show/hide subordinates
- **Zoom/Pan:** Navigate large organizations
- **Color Coding:** By rank or department
- **Export:** SVG or PNG

---

## 6. Analytics Dashboard

### Overview

Display world statistics, activity metrics, and data insights.

**Use Cases:**
- Entity count breakdowns
- Recent activity tracking
- Completeness scores
- User contribution metrics (shared worlds)
- Data quality insights

### Database Schema

No schema changes needed. Uses aggregation queries on existing tables.

### Implementation Steps

1. **Create component:** Use template from `assets/templates/analytics-dashboard.tsx`

2. **Add route:** Create `src/app/(protected)/worlds/[worldId]/analytics/page.tsx`

3. **Install Recharts:**
```bash
npm install recharts
```

### Usage Example

```typescript
// Fetch analytics data
const analytics = await getWorldAnalytics(worldId);

// Render dashboard
<AnalyticsDashboard data={analytics} />
```

### Widgets

#### Entity Counts Pie Chart
```typescript
{
  characters: 45,
  locations: 23,
  factions: 12,
  events: 67,
  items: 34
}
```

#### Activity Line Chart (Last 30 Days)
```typescript
// Entities created per day
[
  { date: "2025-11-01", count: 3 },
  { date: "2025-11-02", count: 5 },
  ...
]
```

#### Completeness Scores
```typescript
// % of required fields filled
{
  characters: 78,
  locations: 92,
  factions: 65,
  events: 88,
  items: 71
}
```

#### Top Contributors (Shared Worlds)
```typescript
// User contributions
[
  { user: "Alice", contributions: 45 },
  { user: "Bob", contributions: 32 },
  ...
]
```

#### Most Connected Entities
```typescript
// Entities with most relationships
[
  { name: "Jon Snow", connections: 23 },
  { name: "Winterfell", connections: 18 },
  ...
]
```

#### Orphaned Entities
```typescript
// Entities with 0 relationships
[
  { id: "xyz", name: "Random Village", type: "location" },
  ...
]
```

### Features

- **Real-Time Updates:** TanStack Query auto-refreshes data
- **Date Range Selector:** Last 7/30/90 days, all time
- **Export:** Download charts as PNG or CSV data
- **Responsive Grid:** Adapts to screen size
- **Dark Mode:** Auto-detects system preference

---

## Export Functionality

All visualizations support export to static files:

### PNG Export (html2canvas)

```typescript
import html2canvas from 'html2canvas';

async function exportToPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2 // High DPI
  });

  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

### SVG Export (D3/React Flow)

```typescript
// For D3 visualizations
const svg = d3.select('svg').node();
const serializer = new XMLSerializer();
const svgString = serializer.serializeToString(svg);
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);

const link = document.createElement('a');
link.download = `${filename}.svg`;
link.href = url;
link.click();
```

### PDF Export (jsPDF)

```typescript
import jsPDF from 'jspdf';

async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
}
```

---

## Server Actions

### Map Actions

```typescript
// src/app/(protected)/worlds/[worldId]/maps/actions.ts
"use server";

export async function createMap(data: CreateMapInput) {
  const validated = createMapSchema.parse(data);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const map = await prisma.worldMap.create({
    data: { ...validated, userId: user.id }
  });

  revalidatePath(`/worlds/${data.worldId}/maps`);
  return { success: true, data: map };
}

export async function createMapMarker(data: CreateMapMarkerInput) {
  // Similar validation and creation
}
```

### Timeline Actions

```typescript
// src/app/(protected)/worlds/[worldId]/timeline/actions.ts
"use server";

export async function createTimeline(data: CreateTimelineInput) {
  // Validation and creation
}

export async function createTimelineEvent(data: CreateTimelineEventInput) {
  // Validation and creation
}
```

### Analytics Actions

```typescript
// src/app/(protected)/worlds/[worldId]/analytics/actions.ts
"use server";

export async function getWorldAnalytics(worldId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Entity counts
  const entityCounts = await prisma.entity.groupBy({
    by: ['type'],
    where: { worldId },
    _count: true
  });

  // Activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activity = await prisma.entity.groupBy({
    by: ['createdAt'],
    where: {
      worldId,
      createdAt: { gte: thirtyDaysAgo }
    },
    _count: true,
    orderBy: { createdAt: 'asc' }
  });

  // Most connected entities
  const mostConnected = await prisma.entity.findMany({
    where: { worldId },
    include: {
      _count: {
        select: {
          relationshipsFrom: true,
          relationshipsTo: true
        }
      }
    },
    orderBy: {
      relationshipsFrom: { _count: 'desc' }
    },
    take: 10
  });

  // Orphaned entities
  const orphaned = await prisma.entity.findMany({
    where: {
      worldId,
      AND: [
        { relationshipsFrom: { none: {} } },
        { relationshipsTo: { none: {} } }
      ]
    },
    select: { id: true, name: true, type: true }
  });

  return {
    entityCounts,
    activity,
    mostConnected,
    orphaned
  };
}
```

---

## Testing

### Unit Tests

Test data transformation functions:

```typescript
// src/lib/visualization/__tests__/graph-transform.test.ts
import { transformRelationshipsToGraph } from '../graph-transform';

describe('transformRelationshipsToGraph', () => {
  it('should convert relationships to nodes and edges', () => {
    const relationships = [
      {
        id: '1',
        fromEntityId: 'a',
        toEntityId: 'b',
        type: 'ally',
        fromEntity: { id: 'a', name: 'Alice', type: 'character' },
        toEntity: { id: 'b', name: 'Bob', type: 'character' }
      }
    ];

    const result = transformRelationshipsToGraph(relationships);

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].label).toBe('ally');
  });
});
```

### Integration Tests

Test with real database:

```typescript
// src/app/(protected)/worlds/[worldId]/__tests__/analytics.integration.test.ts
import { getWorldAnalytics } from '../analytics/actions';

describe('getWorldAnalytics', () => {
  it('should return analytics for world', async () => {
    const analytics = await getWorldAnalytics(testWorldId);

    expect(analytics.entityCounts).toBeDefined();
    expect(analytics.activity).toBeInstanceOf(Array);
    expect(analytics.orphaned).toBeInstanceOf(Array);
  });
});
```

### E2E Tests

Test full visualization workflows:

```typescript
// e2e/visualization.spec.ts
import { test, expect } from '@playwright/test';

test('should create map and add markers', async ({ page }) => {
  await page.goto('/worlds/test-world/maps');

  // Upload map
  await page.setInputFiles('input[type="file"]', 'test-map.png');
  await page.fill('input[name="name"]', 'Test Map');
  await page.click('button[type="submit"]');

  // Add marker
  await page.click('canvas', { position: { x: 200, y: 150 } });
  await page.fill('input[name="markerName"]', 'Test City');
  await page.selectOption('select[name="type"]', 'city');
  await page.click('button:has-text("Add Marker")');

  // Verify marker appears
  await expect(page.locator('.map-marker:has-text("Test City")')).toBeVisible();
});

test('should filter timeline events', async ({ page }) => {
  await page.goto('/worlds/test-world/timeline');

  // Verify all events visible
  await expect(page.locator('.timeline-event')).toHaveCount(10);

  // Filter by type
  await page.selectOption('select[name="typeFilter"]', 'battle');
  await expect(page.locator('.timeline-event')).toHaveCount(3);
});
```

---

## Performance Optimization

### Large Datasets

**Problem:** Graphs with 1000+ nodes slow down rendering

**Solutions:**
1. **Virtualization:** Only render visible nodes
2. **Pagination:** Load entities in chunks
3. **Level of Detail:** Show simplified view when zoomed out
4. **Clustering:** Group nearby nodes

```typescript
// Example: Cluster nodes by type
const clusteredNodes = useMemo(() => {
  if (zoom < 0.5) {
    // Zoomed out: show type clusters
    return entityTypes.map(type => ({
      id: type,
      label: `${type}s (${counts[type]})`,
      type: 'cluster'
    }));
  } else {
    // Zoomed in: show individual nodes
    return allNodes;
  }
}, [zoom, entityTypes, allNodes]);
```

### Real-Time Updates

Use TanStack Query with optimistic updates:

```typescript
const { data: markers } = useQuery({
  queryKey: ['map-markers', mapId],
  queryFn: () => fetchMapMarkers(mapId),
  refetchInterval: 30000 // Refresh every 30s
});

const { mutate: addMarker } = useMutation({
  mutationFn: createMapMarker,
  onMutate: async (newMarker) => {
    // Optimistic update
    queryClient.setQueryData(['map-markers', mapId], (old) =>
      [...old, { ...newMarker, id: 'temp-id' }]
    );
  },
  onSettled: () => {
    queryClient.invalidateQueries(['map-markers', mapId]);
  }
});
```

### Lazy Loading

Only load visualization libraries when needed:

```typescript
// Lazy load map component
const InteractiveMap = lazy(() => import('@/components/visualizations/InteractiveMap'));

function MapPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InteractiveMap mapId={mapId} />
    </Suspense>
  );
}
```

---

## Accessibility

All visualizations must be accessible:

### Keyboard Navigation

```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  aria-label="Map marker: Winterfell"
>
  {children}
</div>
```

### ARIA Labels

```typescript
<svg aria-label="Family tree for House Stark">
  <g role="group" aria-label="Ned Stark and children">
    <circle role="img" aria-label="Ned Stark, father" />
    <circle role="img" aria-label="Robb Stark, son" />
  </g>
</svg>
```

### Screen Reader Support

Provide text alternatives:

```typescript
<div className="sr-only">
  This graph shows 45 characters with 123 relationships.
  Most connected: Jon Snow with 23 connections.
</div>

<div aria-hidden="true">
  {/* Visual graph */}
</div>
```

---

## Common Patterns

### Data Fetching Pattern

```typescript
// In page component
export default async function MapPage({ params }: { params: { worldId: string } }) {
  // Server-side data fetch
  const map = await prisma.worldMap.findFirst({
    where: { worldId: params.worldId },
    include: { markers: true, routes: true }
  });

  if (!map) notFound();

  return <InteractiveMapClient initialData={map} />;
}

// Client component with real-time updates
'use client';

function InteractiveMapClient({ initialData }) {
  const { data: map } = useQuery({
    queryKey: ['map', initialData.id],
    queryFn: () => fetchMap(initialData.id),
    initialData
  });

  return <MapCanvas map={map} />;
}
```

### Form Validation Pattern

```typescript
// Zod schema
const createMarkerSchema = z.object({
  mapId: z.string(),
  name: z.string().min(1).max(100),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  type: z.enum(['city', 'landmark', 'battle', 'other']),
  description: z.string().optional()
});

// React Hook Form
const form = useForm<CreateMarkerInput>({
  resolver: zodResolver(createMarkerSchema)
});

// Server Action
export async function createMapMarker(data: CreateMarkerInput) {
  const validated = createMarkerSchema.parse(data); // Validate again
  // ... create marker
}
```

### Error Handling Pattern

```typescript
function MapPage() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['map', mapId],
    queryFn: fetchMap
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState message="No map found" />;

  return <InteractiveMap data={data} />;
}
```

---

## Troubleshooting

### Issue: Map image not loading

**Cause:** CORS issues with Supabase Storage

**Solution:** Configure CORS in Supabase dashboard:
```json
{
  "origins": ["http://localhost:3000", "https://your-domain.com"],
  "methods": ["GET", "HEAD"],
  "headers": ["*"]
}
```

### Issue: Timeline dates not sorting correctly

**Cause:** String comparison instead of numeric comparison

**Solution:** Normalize dates to numeric values:
```typescript
function parseFlexibleDate(dateStr: string): number {
  // ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr).getFullYear();
  }

  // Year number with era
  const match = dateStr.match(/^(-?\d+)\s*(AC|BCE)?$/);
  if (match) {
    const year = parseInt(match[1]);
    const era = match[2];
    return era === 'BCE' ? -year : year;
  }

  // Fallback
  return 0;
}
```

### Issue: Graph layout looks messy

**Cause:** Too many nodes or poor initial positions

**Solutions:**
1. Use hierarchical layout for structured data
2. Adjust force simulation parameters:
```typescript
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(edges).distance(100))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(30));
```

### Issue: Export PNG is blurry

**Cause:** Low DPI setting

**Solution:** Increase scale factor:
```typescript
await html2canvas(element, {
  scale: 3, // 3x resolution
  useCORS: true, // For external images
  backgroundColor: '#ffffff'
});
```

---

## Next Steps

After implementing visualizations:

1. **Add visualization links** to entity detail pages
2. **Create visualization gallery** page showing all available visualizations
3. **Add sharing** functionality to export and share visualizations
4. **Implement collaboration** features for shared worlds (real-time updates)
5. **Add templates** library with pre-built visualization configurations
6. **Create tutorials** for each visualization type

---

## References

See `references/` directory for detailed documentation:

- `visualization-libraries.md` - Library comparison and selection guide
- `data-processing.md` - Data transformation patterns
- `export-patterns.md` - Export implementation details
