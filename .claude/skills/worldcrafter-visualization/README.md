# WorldCrafter Visualization Skill

Complete visualization toolkit for interactive charts, maps, graphs, trees, and analytics dashboards in WorldCrafter.

## Overview

This skill provides comprehensive guidance and working examples for creating 6 types of visualizations:

1. **Interactive Maps** - Upload custom map images, place markers, draw routes
2. **Timeline Visualizations** - Display events with flexible date parsing
3. **Relationship Graphs** - Visualize entity connections and relationships
4. **Family Trees** - Generate genealogy charts from character relationships
5. **Organizational Charts** - Display faction hierarchies
6. **Analytics Dashboards** - Show world statistics and insights

## Quick Start

### 1. Read the Main Skill Guide

Start with `SKILL.md` for complete documentation including:
- Installation instructions for all libraries
- Database schema additions
- Implementation steps for each visualization
- Usage examples
- Performance optimization
- Accessibility best practices
- Troubleshooting

### 2. Review Component Templates

Check `assets/templates/` for complete, working React component examples:

- `interactive-map.tsx` - Leaflet.js map with markers and routes
- `timeline-view.tsx` - vis-timeline with flexible date parsing
- `relationship-graph.tsx` - React Flow network graph
- `family-tree.tsx` - D3.js hierarchical tree
- `org-chart.tsx` - D3.js organizational chart
- `analytics-dashboard.tsx` - Recharts analytics dashboard

Each template includes:
- TypeScript types
- TanStack Query data fetching
- Real-time updates
- Export functionality
- Responsive design
- Dark mode support
- Accessibility features

### 3. Study Reference Documentation

Dive into `references/` for in-depth guides:

- `visualization-libraries.md` - Library comparison, decision matrix, performance tips
- `data-processing.md` - Data transformation patterns for each visualization type
- `export-patterns.md` - Complete export implementations (PNG, SVG, PDF, CSV)

### 4. Generate New Visualizations

Use the Python script to scaffold new visualizations:

```bash
cd .claude/skills/worldcrafter-visualization/scripts
python generate_visualization.py
```

The script will:
- Prompt for visualization details
- Generate React component boilerplate
- Create Server Actions
- Generate API routes
- Create Prisma schema snippet
- Generate documentation

## File Structure

```
worldcrafter-visualization/
├── SKILL.md                    # Main skill documentation (32KB)
├── README.md                   # This file
├── assets/
│   └── templates/
│       ├── interactive-map.tsx          (14KB)
│       ├── timeline-view.tsx            (15KB)
│       ├── relationship-graph.tsx       (15KB)
│       ├── family-tree.tsx              (9KB)
│       ├── org-chart.tsx                (11KB)
│       └── analytics-dashboard.tsx      (14KB)
├── references/
│   ├── visualization-libraries.md       (13KB)
│   ├── data-processing.md               (19KB)
│   └── export-patterns.md               (24KB)
└── scripts/
    └── generate_visualization.py        (14KB)
```

## Installation

### Required Dependencies (per visualization)

**Interactive Map:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Timeline:**
```bash
npm install vis-timeline vis-data
```

**Relationship Graph:**
```bash
npm install @xyflow/react
```

**Family Tree / Org Chart:**
```bash
npm install d3
npm install -D @types/d3
```

**Analytics Dashboard:**
```bash
npm install recharts
```

**Export Functionality:**
```bash
npm install html2canvas jspdf
npm install -D @types/html2canvas @types/jspdf
```

### Install All Dependencies

```bash
npm install leaflet react-leaflet vis-timeline vis-data @xyflow/react d3 recharts html2canvas jspdf
npm install -D @types/leaflet @types/d3 @types/html2canvas @types/jspdf
```

## Usage Examples

### Interactive Map

```typescript
import InteractiveMap from '@/components/visualizations/InteractiveMap';

export default function MapPage({ params }: { params: { worldId: string } }) {
  return (
    <InteractiveMap
      mapId={mapId}
      imageUrl="https://storage.supabase.co/maps/map.png"
      width={2048}
      height={1536}
    />
  );
}
```

### Timeline

```typescript
import TimelineView from '@/components/visualizations/TimelineView';

export default function TimelinePage({ params }: { params: { worldId: string } }) {
  return (
    <TimelineView
      timelineId={timelineId}
      worldId={params.worldId}
    />
  );
}
```

### Relationship Graph

```typescript
import RelationshipGraph from '@/components/visualizations/RelationshipGraph';

export default function GraphPage({ params }: { params: { worldId: string } }) {
  return (
    <RelationshipGraph worldId={params.worldId} />
  );
}
```

### Family Tree

```typescript
import FamilyTree from '@/components/visualizations/FamilyTree';

export default function FamilyTreePage({ params }: { params: { characterId: string } }) {
  return (
    <FamilyTree
      characterId={params.characterId}
      worldId={worldId}
    />
  );
}
```

### Org Chart

```typescript
import OrgChart from '@/components/visualizations/OrgChart';

export default function OrgChartPage({ params }: { params: { factionId: string } }) {
  return (
    <OrgChart factionId={params.factionId} />
  );
}
```

### Analytics Dashboard

```typescript
import AnalyticsDashboard from '@/components/visualizations/AnalyticsDashboard';

export default function AnalyticsPage({ params }: { params: { worldId: string } }) {
  return (
    <AnalyticsDashboard worldId={params.worldId} />
  );
}
```

## Database Schema

Each visualization requires specific database tables. See `SKILL.md` for complete schema definitions.

### Quick Setup

1. Copy schema from `SKILL.md` to `prisma/schema.prisma`
2. Run migration:
```bash
npx prisma migrate dev --name add_visualization_tables
```
3. Apply RLS policies:
```bash
npm run db:rls
```
4. Regenerate Prisma client:
```bash
npx prisma generate
```

## Export Functionality

All visualizations support exporting:

**PNG Export:**
```typescript
await exportToPNG('visualization-container', 'my-visualization');
```

**SVG Export (for D3/React Flow):**
```typescript
exportToSVG('svg-element-id', 'my-visualization');
```

**PDF Export:**
```typescript
await exportToPDF('visualization-container', 'my-visualization');
```

**CSV Export (for data):**
```typescript
exportToCSV(data, 'my-data');
```

See `references/export-patterns.md` for complete implementations.

## Features

### All Visualizations Include

- **Real-time Updates** - TanStack Query with automatic refetching
- **Export Functionality** - PNG, SVG, PDF, and/or CSV
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode** - Automatic theme detection
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- **Performance** - Optimized for large datasets
- **Error Handling** - Graceful degradation and error messages
- **Loading States** - Skeleton loaders and spinners
- **Empty States** - Helpful messages when no data

### Interactive Features

- **Pan & Zoom** - Navigate large visualizations
- **Click & Select** - Interact with elements
- **Filters** - Show/hide specific data
- **Search** - Find specific elements
- **Detail Views** - Popups/modals with full information
- **Drag & Drop** - Rearrange elements (where applicable)

## Testing

### Unit Tests

```typescript
// src/components/visualizations/__tests__/InteractiveMap.test.tsx
import { render, screen } from '@testing-library/react';
import InteractiveMap from '../InteractiveMap';

describe('InteractiveMap', () => {
  it('renders map container', () => {
    render(<InteractiveMap {...props} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// e2e/visualizations.spec.ts
import { test, expect } from '@playwright/test';

test('should display interactive map', async ({ page }) => {
  await page.goto('/worlds/test-world/maps');
  await expect(page.locator('.leaflet-container')).toBeVisible();
});
```

## Performance Tips

1. **Lazy Load** - Only load visualizations when visible
2. **Virtualization** - Use windowing for large lists
3. **Memoization** - Cache expensive transformations
4. **Debouncing** - Debounce user input handlers
5. **Web Workers** - Offload heavy computations
6. **Pagination** - Load data in chunks
7. **Caching** - Use TanStack Query stale time

See `SKILL.md` for detailed performance optimization strategies.

## Troubleshooting

### Common Issues

**Map images not loading:**
- Check Supabase Storage CORS settings
- Verify image URLs are publicly accessible
- Enable `useCORS` in html2canvas options

**Timeline dates not sorting:**
- Ensure date parsing returns numeric values
- Check for null/undefined dates
- Verify date format consistency

**Graph layout looks messy:**
- Try different layout algorithms (hierarchical, circular, grid)
- Adjust force simulation parameters
- Reduce number of visible nodes with filters

**Export is blurry:**
- Increase scale factor (2x or 3x)
- Check element dimensions
- Ensure images loaded before export

**Performance issues:**
- Reduce dataset size with pagination
- Use virtualization for large lists
- Enable data clustering
- Switch to Canvas rendering for D3

See `SKILL.md` for detailed troubleshooting guides.

## Contributing

To add a new visualization:

1. Run the generator script:
```bash
python scripts/generate_visualization.py
```

2. Review and customize generated files

3. Add to `SKILL.md` documentation

4. Create tests

5. Update this README

## Resources

### External Documentation

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [vis-timeline Documentation](https://visjs.github.io/vis-timeline/docs/timeline/)
- [React Flow Documentation](https://reactflow.dev/)
- [D3 Documentation](https://d3js.org/)
- [Recharts Documentation](https://recharts.org/)

### WorldCrafter Resources

- Main README: `D:\worldcrafter\README.md`
- CLAUDE.md: `D:\worldcrafter\CLAUDE.md`
- Testing Guide: `D:\worldcrafter\docs\TESTING_CHECKLIST.md`
- RLS Setup: `D:\worldcrafter\docs\RLS_SETUP.md`

## Version History

- **1.0.0** (2025-11-09) - Initial release
  - 6 visualization types
  - Complete component templates
  - Reference documentation
  - Generator script

## License

Part of WorldCrafter project. See main project README for license information.

---

**Need Help?**

1. Check `SKILL.md` for comprehensive documentation
2. Review component templates in `assets/templates/`
3. Study reference guides in `references/`
4. Run generator script for new visualizations
5. Check troubleshooting section in `SKILL.md`
