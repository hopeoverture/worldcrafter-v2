# WorldCrafter Visualization - Quick Reference Card

One-page cheat sheet for rapid implementation.

## Installation Commands

```bash
# Install all visualization libraries
npm install leaflet react-leaflet vis-timeline vis-data @xyflow/react d3 recharts html2canvas jspdf

# Install TypeScript types
npm install -D @types/leaflet @types/d3 @types/html2canvas @types/jspdf
```

## Decision Matrix

| Need to visualize... | Use this | Library | File |
|---------------------|----------|---------|------|
| Custom map with markers | Interactive Map | Leaflet | `interactive-map.tsx` |
| Events on timeline | Timeline View | vis-timeline | `timeline-view.tsx` |
| Entity relationships | Relationship Graph | React Flow | `relationship-graph.tsx` |
| Family genealogy | Family Tree | D3 | `family-tree.tsx` |
| Faction hierarchy | Org Chart | D3 | `org-chart.tsx` |
| World statistics | Analytics Dashboard | Recharts | `analytics-dashboard.tsx` |

## Common Imports

```typescript
// Maps
import L from 'leaflet';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Timelines
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

// Graphs
import ReactFlow, { Node, Edge, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Trees
import * as d3 from 'd3';

// Charts
import { LineChart, BarChart, PieChart } from 'recharts';

// Export
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
```

## Data Fetching Pattern

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export default function Visualization({ worldId }: { worldId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['viz-data', worldId],
    queryFn: async () => {
      const res = await fetch(`/api/worlds/${worldId}/data`);
      return res.json();
    },
    refetchInterval: 30000
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;

  return <VisualizationComponent data={data} />;
}
```

## Server Action Pattern

```typescript
"use server";

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getData(worldId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  return await prisma.entity.findMany({
    where: { worldId }
  });
}

export async function createItem(data: CreateInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const item = await prisma.entity.create({ data });
  revalidatePath(`/worlds/${data.worldId}`);
  return { success: true, data: item };
}
```

## Export Functions

```typescript
// PNG
import html2canvas from 'html2canvas';

async function exportToPNG(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element, { scale: 2 });
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob!);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  });
}

// SVG
function exportToSVG(svgId: string, filename: string) {
  const svg = document.getElementById(svgId) as SVGSVGElement;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

// CSV
function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.csv`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

## Database Schema Snippets

```prisma
// Map
model WorldMap {
  id       String      @id @default(cuid())
  worldId  String      @map("world_id")
  imageUrl String      @map("image_url")
  width    Int
  height   Int
  markers  MapMarker[]
  @@map("world_maps")
}

model MapMarker {
  id      String   @id @default(cuid())
  mapId   String   @map("map_id")
  name    String
  x       Float
  y       Float
  type    String
  map     WorldMap @relation(fields: [mapId], references: [id])
  @@map("map_markers")
}

// Timeline
model Timeline {
  id     String          @id @default(cuid())
  worldId String         @map("world_id")
  name   String
  events TimelineEvent[]
  @@map("timelines")
}

model TimelineEvent {
  id         String   @id @default(cuid())
  timelineId String   @map("timeline_id")
  name       String
  startDate  String   @map("start_date")
  type       String
  timeline   Timeline @relation(fields: [timelineId], references: [id])
  @@map("timeline_events")
}
```

## Coordinate Conversions

```typescript
// Percentage → Leaflet (for maps)
const lat = (y_percent / 100) * imageHeight;
const lng = (x_percent / 100) * imageWidth;

// Leaflet → Percentage
const x_percent = (lng / imageWidth) * 100;
const y_percent = (lat / imageHeight) * 100;

// Year string → Number (for timelines)
function parseYear(dateStr: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr).getFullYear();
  }
  const match = dateStr.match(/^(-?\d+)\s*(AC|BCE)?$/i);
  if (match) {
    const year = parseInt(match[1]);
    return match[2]?.toUpperCase() === 'BCE' ? -year : year;
  }
  return 0;
}
```

## Performance Optimizations

```typescript
// Memoize expensive transformations
const transformedData = useMemo(() => {
  return transformData(rawData);
}, [rawData]);

// Virtualize large lists
import { useVirtualizer } from '@tanstack/react-virtual';

// Debounce user input
import { useDebouncedValue } from '@/hooks/useDebounce';
const debouncedSearch = useDebouncedValue(search, 300);

// Lazy load visualizations
const InteractiveMap = lazy(() => import('@/components/visualizations/InteractiveMap'));

<Suspense fallback={<LoadingSkeleton />}>
  <InteractiveMap {...props} />
</Suspense>
```

## Accessibility

```typescript
// Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
  aria-label="Map marker: Winterfell"
>

// Screen reader text
<div className="sr-only">
  This graph shows {nodeCount} entities with {edgeCount} relationships.
</div>

// ARIA labels
<svg aria-label="Family tree for House Stark">
  <title>Family Tree</title>
  <desc>Interactive family tree showing 5 generations</desc>
</svg>
```

## Common Layouts

```typescript
// D3 Tree (top-to-bottom)
const tree = d3.tree<NodeData>()
  .size([width, height])
  .separation((a, b) => a.parent === b.parent ? 1 : 2);

// D3 Tree (radial)
const tree = d3.tree<NodeData>()
  .size([2 * Math.PI, radius]);

// React Flow (hierarchical)
import dagre from '@dagrejs/dagre';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });
dagre.layout(dagreGraph);

// React Flow (circular)
const radius = nodes.length * 30;
const angle = (index / nodes.length) * 2 * Math.PI;
const x = radius * Math.cos(angle);
const y = radius * Math.sin(angle);
```

## Testing Patterns

```typescript
// Unit test
import { render, screen } from '@testing-library/react';

test('renders visualization', () => {
  render(<Visualization worldId="test" />);
  expect(screen.getByRole('region')).toBeInTheDocument();
});

// E2E test
import { test, expect } from '@playwright/test';

test('exports visualization', async ({ page }) => {
  await page.goto('/worlds/test/maps');
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Export PNG")');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Images not loading | Enable `useCORS: true` in html2canvas |
| Blurry export | Increase scale: `{ scale: 3 }` |
| Timeline not sorting | Normalize dates to numbers first |
| Graph looks messy | Try hierarchical layout or reduce nodes |
| Performance issues | Add pagination or virtualization |
| CORS errors | Configure Supabase Storage CORS |

## File Locations

```
src/
├── components/visualizations/
│   ├── InteractiveMap.tsx
│   ├── TimelineView.tsx
│   ├── RelationshipGraph.tsx
│   ├── FamilyTree.tsx
│   ├── OrgChart.tsx
│   └── AnalyticsDashboard.tsx
├── app/(protected)/worlds/[worldId]/
│   ├── maps/page.tsx
│   ├── timeline/page.tsx
│   ├── graph/page.tsx
│   └── analytics/page.tsx
└── app/api/worlds/[worldId]/
    ├── maps/route.ts
    ├── timeline/route.ts
    └── analytics/route.ts
```

## Generator Script

```bash
# Generate new visualization
cd .claude/skills/worldcrafter-visualization/scripts
python generate_visualization.py

# Follow prompts, then:
# 1. Review generated files
# 2. Add schema to prisma/schema.prisma
# 3. Run: npx prisma migrate dev --name add_new_viz
# 4. Run: npm run db:rls
# 5. Install dependencies
# 6. Move files to appropriate locations
```

## Next Steps

1. Choose visualization type from decision matrix
2. Copy template from `assets/templates/`
3. Add database schema from `SKILL.md`
4. Run migrations and RLS
5. Install required dependencies
6. Implement data fetching
7. Add export functionality
8. Write tests
9. Deploy!

---

For complete documentation, see `SKILL.md` (32KB)
For detailed examples, see `assets/templates/` (6 files)
For reference guides, see `references/` (3 files)
