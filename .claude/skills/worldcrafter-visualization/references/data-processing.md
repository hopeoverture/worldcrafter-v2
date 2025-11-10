# Data Processing for Visualizations

Guide for transforming WorldCrafter entity data into visualization-ready formats.

---

## General Principles

### 1. Data Flow Architecture

```
Database (Prisma) → Server Action → API/Component → Transform → Visualization
```

**Key Points:**
- Fetch data on server when possible (better performance)
- Transform data close to visualization (easier debugging)
- Cache transformed data (avoid redundant processing)
- Use TanStack Query for client-side data management

---

## Map Data Transformation

### Input: Database Records

```typescript
// Database schema
{
  id: "map_123",
  worldId: "world_456",
  imageUrl: "https://storage.supabase.co/maps/map.png",
  width: 2048,
  height: 1536,
  markers: [
    {
      id: "marker_1",
      name: "Winterfell",
      x: 45.5,  // Percentage
      y: 32.0,  // Percentage
      type: "city",
      locationId: "loc_789"
    }
  ]
}
```

### Output: Leaflet Format

```typescript
interface LeafletMarker {
  id: string;
  position: [number, number]; // [lat, lng]
  name: string;
  type: string;
  icon: L.DivIcon;
  popupContent: string;
}

function transformMapData(mapData: MapData): LeafletMarker[] {
  return mapData.markers.map(marker => {
    // Convert percentage coordinates to Leaflet LatLng
    const lat = (marker.y / 100) * mapData.height;
    const lng = (marker.x / 100) * mapData.width;

    // Create custom icon
    const markerType = MARKER_TYPES[marker.type] || MARKER_TYPES.landmark;
    const icon = L.divIcon({
      html: `
        <div style="
          background-color: ${markerType.color};
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${markerType.icon}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    return {
      id: marker.id,
      position: [lat, lng],
      name: marker.name,
      type: marker.type,
      icon,
      popupContent: generatePopupContent(marker)
    };
  });
}
```

### Coordinate Systems

**Database Storage (Percentage):**
- x: 0-100 (left to right)
- y: 0-100 (top to bottom)
- Independent of image size
- Easy to scale

**Leaflet (LatLng):**
- Uses custom CRS (Coordinate Reference System)
- Bounds: [[0, 0], [height, width]]
- lat: 0 to height
- lng: 0 to width

**Conversion:**
```typescript
// Percentage → Leaflet
const lat = (y_percent / 100) * height;
const lng = (x_percent / 100) * width;

// Leaflet → Percentage
const x_percent = (lng / width) * 100;
const y_percent = (lat / height) * 100;
```

---

## Timeline Data Transformation

### Input: Database Records

```typescript
{
  id: "timeline_123",
  events: [
    {
      id: "event_1",
      name: "Battle of Waterloo",
      startDate: "1815",
      endDate: null,
      type: "battle"
    },
    {
      id: "event_2",
      name: "The Long Night",
      startDate: "-8000",  // 8000 years before reference
      endDate: "-7998",
      type: "catastrophe"
    }
  ]
}
```

### Output: vis-timeline Format

```typescript
interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  type: 'point' | 'range';
  style: string;
  title: string;
}

function transformTimelineData(events: TimelineEvent[]): TimelineItem[] {
  return events.map(event => {
    const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.celebration;

    // Parse flexible dates
    const startYear = parseFlexibleDate(event.startDate);
    const endYear = event.endDate ? parseFlexibleDate(event.endDate) : null;

    // Convert to JavaScript Date objects
    const startDate = yearToDate(startYear);
    const endDate = endYear ? yearToDate(endYear) : undefined;

    return {
      id: event.id,
      content: `${eventType.icon} ${event.name}`,
      start: startDate,
      end: endDate,
      type: endDate ? 'range' : 'point',
      style: `background-color: ${eventType.color}; border-color: ${eventType.color};`,
      title: event.description || event.name
    };
  });
}
```

### Date Parsing Strategy

```typescript
function parseFlexibleDate(dateStr: string): number {
  // 1. ISO date: "2024-01-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr).getFullYear();
  }

  // 2. Simple year: "1815", "-1453"
  if (/^-?\d+$/.test(dateStr)) {
    return parseInt(dateStr);
  }

  // 3. Year with era: "342 AC", "1453 BCE"
  const eraMatch = dateStr.match(/^(-?\d+)\s*(AC|CE|BCE|BC|AD)$/i);
  if (eraMatch) {
    const year = parseInt(eraMatch[1]);
    const era = eraMatch[2].toUpperCase();

    if (era === 'BCE' || era === 'BC') {
      return -Math.abs(year);
    }
    return year;
  }

  // 4. Relative: "8000 years before X"
  const relativeMatch = dateStr.match(/^(\d+)\s*years?\s*(before|after)\s+(.+)$/i);
  if (relativeMatch) {
    const offset = parseInt(relativeMatch[1]);
    const direction = relativeMatch[2].toLowerCase();
    const anchorEvent = relativeMatch[3];

    // Look up anchor event year (requires additional query)
    const anchorYear = getAnchorEventYear(anchorEvent);
    return direction === 'before' ? anchorYear - offset : anchorYear + offset;
  }

  // 5. Named events: "The Long Night"
  // Requires date mapping table in database
  const namedYear = getNamedEventYear(dateStr);
  if (namedYear !== null) {
    return namedYear;
  }

  // Fallback
  console.warn(`Could not parse date: ${dateStr}`);
  return 0;
}

// Convert year number to JavaScript Date
function yearToDate(year: number): Date {
  // Handle negative years (BCE)
  if (year < 0) {
    // JavaScript Date doesn't support years before 0
    // Use a placeholder date with negative timestamp
    return new Date(year * 365.25 * 24 * 60 * 60 * 1000);
  }

  return new Date(year, 0, 1); // January 1st of year
}
```

### Date Formatting

```typescript
function formatDate(year: number, format: 'standard' | 'custom', era?: string): string {
  if (format === 'standard') {
    if (year < 0) {
      return `${Math.abs(year)} BCE`;
    }
    return `${year} CE`;
  }

  // Custom format with era
  if (era) {
    return `${year} ${era}`;
  }

  return year.toString();
}
```

---

## Graph Data Transformation

### Input: Database Relationships

```typescript
{
  relationships: [
    {
      id: "rel_1",
      fromEntityId: "char_1",
      toEntityId: "char_2",
      type: "parent-of",
      bidirectional: false,
      fromEntity: {
        id: "char_1",
        name: "Ned Stark",
        type: "character",
        imageUrl: "..."
      },
      toEntity: {
        id: "char_2",
        name: "Robb Stark",
        type: "character",
        imageUrl: "..."
      }
    }
  ]
}
```

### Output: React Flow Format

```typescript
interface GraphNode {
  id: string;
  type: string;
  data: {
    label: string;
    type: string;
    imageUrl?: string;
  };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  markerEnd?: { type: string };
  animated?: boolean;
  style?: React.CSSProperties;
}

function transformRelationshipsToGraph(
  relationships: Relationship[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Extract unique entities
  const entityMap = new Map<string, Entity>();

  relationships.forEach(rel => {
    if (!entityMap.has(rel.fromEntityId)) {
      entityMap.set(rel.fromEntityId, rel.fromEntity);
    }
    if (!entityMap.has(rel.toEntityId)) {
      entityMap.set(rel.toEntityId, rel.toEntity);
    }
  });

  // Create nodes
  const nodes: GraphNode[] = Array.from(entityMap.values()).map(entity => ({
    id: entity.id,
    type: 'custom',
    data: {
      label: entity.name,
      type: entity.type,
      imageUrl: entity.imageUrl
    },
    position: { x: 0, y: 0 }, // Will be set by layout algorithm
    style: {
      background: ENTITY_COLORS[entity.type] || '#6b7280',
      color: 'white',
      border: '2px solid white',
      borderRadius: '8px',
      padding: '10px',
      width: 150,
      fontSize: '12px',
      fontWeight: 'bold'
    }
  }));

  // Create edges
  const edges: GraphEdge[] = relationships.map(rel => ({
    id: rel.id,
    source: rel.fromEntityId,
    target: rel.toEntityId,
    label: rel.type,
    type: rel.bidirectional ? 'default' : 'smoothstep',
    markerEnd: rel.bidirectional ? undefined : {
      type: 'arrowclosed'
    },
    animated: false,
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8'
    }
  }));

  return { nodes, edges };
}
```

### Layout Algorithms

**1. Force-Directed (Automatic)**

React Flow handles this automatically, but you can customize:

```typescript
import { useNodesState, useEdgesState } from '@xyflow/react';

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

// Nodes will auto-arrange based on connections
```

**2. Hierarchical (dagre)**

```typescript
import dagre from '@dagrejs/dagre';

function getHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100,
    ranksep: 150
  });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 150, height: 80 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 40
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

**3. Circular**

```typescript
function getCircularLayout(nodes: GraphNode[], edges: GraphEdge[]) {
  const radius = Math.max(300, nodes.length * 30);
  const centerX = 0;
  const centerY = 0;

  const layoutedNodes = nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## Tree Data Transformation

### Input: Hierarchical Relationships

```typescript
{
  relationships: [
    {
      fromEntityId: "parent_1",
      toEntityId: "child_1",
      type: "parent-of"
    },
    {
      fromEntityId: "parent_1",
      toEntityId: "child_2",
      type: "parent-of"
    }
  ]
}
```

### Output: D3 Hierarchy Format

```typescript
interface TreeNode {
  id: string;
  name: string;
  imageUrl?: string;
  children?: TreeNode[];
}

function buildTreeFromRelationships(
  rootId: string,
  relationships: Relationship[],
  entities: Map<string, Entity>
): TreeNode {
  const entity = entities.get(rootId);
  if (!entity) throw new Error(`Entity ${rootId} not found`);

  // Find children
  const childRelationships = relationships.filter(
    rel => rel.fromEntityId === rootId && rel.type === 'parent-of'
  );

  const children = childRelationships.map(rel =>
    buildTreeFromRelationships(rel.toEntityId, relationships, entities)
  );

  return {
    id: entity.id,
    name: entity.name,
    imageUrl: entity.imageUrl,
    children: children.length > 0 ? children : undefined
  };
}
```

### Finding Root Node

```typescript
function findTreeRoot(relationships: Relationship[]): string {
  // Find entity with no parents
  const childIds = new Set(
    relationships
      .filter(rel => rel.type === 'parent-of')
      .map(rel => rel.toEntityId)
  );

  const parentIds = new Set(
    relationships
      .filter(rel => rel.type === 'parent-of')
      .map(rel => rel.fromEntityId)
  );

  // Root is a parent but not a child
  const rootIds = Array.from(parentIds).filter(id => !childIds.has(id));

  if (rootIds.length === 0) {
    // No clear root, find oldest or most connected
    return findMostConnectedEntity(relationships);
  }

  // If multiple roots, pick the first (or let user choose)
  return rootIds[0];
}
```

---

## Analytics Data Aggregation

### Entity Counts

```typescript
async function getEntityCounts(worldId: string) {
  const counts = await prisma.entity.groupBy({
    by: ['type'],
    where: { worldId },
    _count: {
      _all: true
    }
  });

  // Transform to object
  return counts.reduce((acc, item) => {
    acc[item.type] = item._count._all;
    return acc;
  }, {} as Record<string, number>);
}
```

### Activity Over Time

```typescript
async function getActivityData(worldId: string, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entities = await prisma.entity.findMany({
    where: {
      worldId,
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true
    }
  });

  // Group by date
  const activityByDate = entities.reduce((acc, entity) => {
    const date = entity.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fill missing dates with 0
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    const dateStr = date.toISOString().split('T')[0];

    result.push({
      date: dateStr,
      count: activityByDate[dateStr] || 0
    });
  }

  return result;
}
```

### Completeness Scores

```typescript
function calculateCompleteness(entity: Entity): number {
  const requiredFields = getRequiredFields(entity.type);
  const filledFields = requiredFields.filter(field =>
    entity[field] !== null && entity[field] !== ''
  );

  return Math.round((filledFields.length / requiredFields.length) * 100);
}

function getRequiredFields(entityType: string): string[] {
  const fieldsByType: Record<string, string[]> = {
    character: ['name', 'description', 'imageUrl', 'birthDate'],
    location: ['name', 'description', 'type', 'imageUrl'],
    faction: ['name', 'description', 'type', 'foundedDate'],
    event: ['name', 'description', 'date', 'type'],
    item: ['name', 'description', 'type']
  };

  return fieldsByType[entityType] || ['name', 'description'];
}

async function getCompletenessScores(worldId: string) {
  const entities = await prisma.entity.findMany({
    where: { worldId }
  });

  const scoresByType = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(calculateCompleteness(entity));
    return acc;
  }, {} as Record<string, number[]>);

  // Calculate average per type
  return Object.entries(scoresByType).reduce((acc, [type, scores]) => {
    acc[type] = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    return acc;
  }, {} as Record<string, number>);
}
```

---

## Caching Strategies

### TanStack Query Cache

```typescript
// Visualizations should use query cache
const { data: graphData } = useQuery({
  queryKey: ['graph', worldId],
  queryFn: async () => {
    const relationships = await fetchRelationships(worldId);
    return transformRelationshipsToGraph(relationships);
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000 // 30 minutes
});
```

### Memoization

```typescript
// Expensive transformations should be memoized
const transformedData = useMemo(() => {
  return transformRelationshipsToGraph(relationships);
}, [relationships]);

// With complex dependencies
const layoutedNodes = useMemo(() => {
  return getHierarchicalLayout(nodes, edges, layout);
}, [nodes, edges, layout]);
```

### Incremental Updates

```typescript
// For real-time updates, use optimistic updates
const { mutate: addMarker } = useMutation({
  mutationFn: createMapMarker,
  onMutate: async (newMarker) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['map-markers', mapId]);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['map-markers', mapId]);

    // Optimistically update
    queryClient.setQueryData(['map-markers', mapId], (old: Marker[]) =>
      [...old, { ...newMarker, id: 'temp-' + Date.now() }]
    );

    return { previous };
  },
  onError: (err, newMarker, context) => {
    // Rollback on error
    queryClient.setQueryData(['map-markers', mapId], context?.previous);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['map-markers', mapId]);
  }
});
```

---

## Error Handling

### Graceful Degradation

```typescript
function TransformWithFallback({ data }: { data: RawData }) {
  try {
    const transformed = transformData(data);
    return <Visualization data={transformed} />;
  } catch (error) {
    console.error('Transform error:', error);
    return <ErrorState message="Unable to display visualization" />;
  }
}
```

### Validation

```typescript
function validateMapData(data: unknown): MapData {
  const schema = z.object({
    id: z.string(),
    imageUrl: z.string().url(),
    width: z.number().positive(),
    height: z.number().positive(),
    markers: z.array(z.object({
      id: z.string(),
      name: z.string(),
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      type: z.string()
    }))
  });

  return schema.parse(data);
}
```

---

## Performance Tips

1. **Batch Database Queries**: Use `include` to fetch relationships in one query
2. **Transform Once**: Cache transformed data, don't re-transform on every render
3. **Lazy Load**: Only fetch visualization data when tab/section is visible
4. **Virtualize**: Use windowing for large lists (react-window, react-virtualized)
5. **Web Workers**: Move heavy transformations off main thread
6. **Pagination**: Load data in chunks for very large datasets
7. **Debounce**: Debounce expensive operations triggered by user input

```typescript
// Example: Web Worker for heavy transformation
const worker = new Worker('/transform-worker.js');

worker.postMessage({ relationships });

worker.onmessage = (e) => {
  const { nodes, edges } = e.data;
  setGraphData({ nodes, edges });
};
```
