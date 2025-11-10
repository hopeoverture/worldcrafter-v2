# Visualization Libraries Reference

Comprehensive guide for choosing the right visualization library for WorldCrafter use cases.

---

## Library Comparison

### 1. Leaflet.js + react-leaflet

**Best For:** Interactive maps with custom images

**Pros:**
- Simple API for image-based maps
- Custom Coordinate Reference System (CRS) support
- Lightweight (39 KB minified)
- Excellent mobile support
- Large plugin ecosystem

**Cons:**
- Not ideal for complex data visualizations
- Limited styling options compared to D3
- Requires additional libraries for advanced features

**Use Cases:**
- World maps with location markers
- Custom fantasy/sci-fi world maps
- Region/territory visualization
- Travel route mapping

**Installation:**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Key Features:**
- Image overlays
- Custom markers with HTML/CSS
- Polylines and polygons
- Pan and zoom controls
- Touch gesture support
- Popup and tooltip support

**When to Choose:**
- Need to display custom map images
- Want simple marker placement
- Require mobile-friendly interaction
- Don't need complex data binding

---

### 2. vis-timeline

**Best For:** Timeline visualizations with flexible dates

**Pros:**
- Handles non-standard date formats
- Excellent zoom/pan controls
- Range and point events
- Good performance (handles 1000+ events)
- Built-in event grouping

**Cons:**
- Limited styling customization
- Heavyweight (242 KB minified)
- Less active development
- Older API design

**Use Cases:**
- Historical timelines
- Fantasy calendar events
- Character life events
- World history spanning millennia

**Installation:**
```bash
npm install vis-timeline vis-data
```

**Key Features:**
- Flexible date parsing
- Zoom levels (year/decade/century)
- Event clustering
- Custom item templates
- Timeline groups/tracks
- Snap to dates

**When to Choose:**
- Need flexible date format support
- Want built-in zoom controls
- Have large numbers of events
- Need timeline grouping

---

### 3. React Flow (@xyflow/react)

**Best For:** Network graphs and relationship visualization

**Pros:**
- Modern React-first API
- Excellent performance (handles 1000+ nodes)
- Built-in layouts (force, hierarchical, etc.)
- Customizable nodes and edges
- Active development and community
- TypeScript support

**Cons:**
- Steeper learning curve
- Requires custom layout algorithms for complex graphs
- Larger bundle size (122 KB minified)

**Use Cases:**
- Entity relationship graphs
- Character connections
- Faction alliances
- Cross-entity relationships

**Installation:**
```bash
npm install @xyflow/react
```

**Key Features:**
- Drag-and-drop nodes
- Custom node/edge components
- Layout algorithms
- Mini-map
- Controls (zoom, fit view)
- Node selection and highlighting
- Edge routing

**When to Choose:**
- Need interactive node-edge graphs
- Want modern React patterns
- Require custom node rendering
- Need performance with large graphs

---

### 4. D3.js

**Best For:** Custom visualizations and complex layouts

**Pros:**
- Ultimate flexibility
- Powerful data binding
- Excellent documentation
- Industry standard
- Works with SVG/Canvas
- Rich ecosystem

**Cons:**
- Steep learning curve
- Verbose API
- Requires more code
- Not React-first (needs wrappers)
- Large bundle (240 KB full, can tree-shake)

**Use Cases:**
- Family trees
- Organizational charts
- Custom visualizations
- Complex hierarchical data

**Installation:**
```bash
npm install d3
npm install -D @types/d3
```

**Key Features:**
- Tree layouts (hierarchical, radial)
- Force simulations
- Data binding
- Transitions and animations
- Scales and axes
- Shape generators
- Zoom and pan behaviors

**When to Choose:**
- Need maximum customization
- Building unique visualizations
- Require precise control
- Working with hierarchical data

**Tips for React Integration:**
```typescript
// Use refs to manage D3 DOM access
const svgRef = useRef<SVGSVGElement>(null);

useEffect(() => {
  if (!svgRef.current) return;

  const svg = d3.select(svgRef.current);
  // D3 code here
}, [data]);
```

---

### 5. Recharts

**Best For:** Charts and analytics dashboards

**Pros:**
- React-first API
- Declarative components
- Responsive by default
- Good TypeScript support
- Beautiful defaults
- Easy to learn

**Cons:**
- Limited customization
- Not ideal for custom visualizations
- Bundle size (380 KB minified)
- Performance issues with large datasets

**Use Cases:**
- Analytics dashboards
- Entity statistics
- Activity charts
- Completeness scores
- Contribution metrics

**Installation:**
```bash
npm install recharts
```

**Key Features:**
- Line, bar, pie, area charts
- Responsive containers
- Tooltips and legends
- Custom label rendering
- Animation support
- Brush for zooming
- Synchronized charts

**When to Choose:**
- Need standard chart types
- Want React components
- Prefer declarative API
- Building dashboards

---

## Decision Matrix

| Use Case | Library | Alternative | Complexity |
|----------|---------|-------------|------------|
| Custom map with markers | Leaflet | Mapbox | Low |
| Timeline with events | vis-timeline | D3 + custom | Low |
| Relationship graph | React Flow | D3 + force | Medium |
| Family tree | D3 | React Flow | Medium |
| Org chart | D3 | React Flow | Medium |
| Analytics dashboard | Recharts | Victory, Chart.js | Low |
| Custom visualization | D3 | Custom Canvas | High |

---

## Performance Considerations

### Leaflet
- **Optimal:** < 500 markers
- **Good:** 500-2000 markers (use clustering)
- **Poor:** > 2000 markers

**Optimization:**
```typescript
// Use marker clustering for large datasets
import MarkerClusterGroup from 'react-leaflet-cluster';

<MarkerClusterGroup>
  {markers.map(marker => <Marker key={marker.id} {...marker} />)}
</MarkerClusterGroup>
```

### vis-timeline
- **Optimal:** < 1000 events
- **Good:** 1000-5000 events
- **Poor:** > 5000 events

**Optimization:**
```typescript
// Use event clustering
timeline.setOptions({
  cluster: {
    maxItems: 3,
    clusterCriteria: (item1, item2) => {
      return Math.abs(item1.start - item2.start) < 1000 * 60 * 60 * 24 * 30; // 30 days
    }
  }
});
```

### React Flow
- **Optimal:** < 500 nodes
- **Good:** 500-1500 nodes
- **Poor:** > 1500 nodes

**Optimization:**
```typescript
// Use virtualization for large graphs
import { ReactFlowProvider } from '@xyflow/react';

// Only render visible nodes
const visibleNodes = nodes.filter(node =>
  isInViewport(node.position, viewport)
);
```

### D3
- **Optimal:** < 1000 elements
- **Good:** 1000-5000 elements (with Canvas)
- **Poor:** > 5000 elements

**Optimization:**
```typescript
// Use Canvas for large datasets instead of SVG
const canvas = d3.select('canvas').node();
const context = canvas.getContext('2d');

// Draw with Canvas API
context.beginPath();
// ... drawing code
```

### Recharts
- **Optimal:** < 500 data points
- **Good:** 500-1000 data points
- **Poor:** > 1000 data points

**Optimization:**
```typescript
// Sample data for large datasets
const sampledData = useMemo(() => {
  if (data.length <= 500) return data;

  const step = Math.ceil(data.length / 500);
  return data.filter((_, i) => i % step === 0);
}, [data]);
```

---

## Bundle Size Comparison

| Library | Minified | Gzipped | Tree-shakeable |
|---------|----------|---------|----------------|
| Leaflet | 39 KB | 13 KB | No |
| react-leaflet | 15 KB | 5 KB | No |
| vis-timeline | 242 KB | 64 KB | No |
| React Flow | 122 KB | 38 KB | Partial |
| D3 (full) | 240 KB | 72 KB | Yes |
| D3 (tree-shaken) | ~50 KB | ~15 KB | Yes |
| Recharts | 380 KB | 110 KB | No |

**Tree-shaking D3:**
```typescript
// Instead of importing all of D3
import * as d3 from 'd3'; // 240 KB

// Import only what you need
import { select } from 'd3-selection';
import { tree, hierarchy } from 'd3-hierarchy';
import { zoom } from 'd3-zoom';
// Total: ~50 KB
```

---

## Accessibility Best Practices

### All Visualizations

**Keyboard Navigation:**
```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

**Screen Reader Support:**
```typescript
<svg aria-label="Family tree for House Stark">
  <title>Family tree showing relationships</title>
  <desc>
    Interactive family tree with {nodeCount} members spanning {generations} generations
  </desc>
</svg>

{/* Hidden text alternative */}
<div className="sr-only">
  This graph shows {nodeCount} nodes with {edgeCount} connections.
  Most connected: {topNode.name} with {topNode.connections} connections.
</div>
```

**Color Contrast:**
```typescript
// Ensure 4.5:1 contrast ratio for text
// Ensure 3:1 contrast ratio for UI elements

const ACCESSIBLE_COLORS = {
  primary: '#2563eb', // Blue with good contrast
  success: '#16a34a', // Green
  danger: '#dc2626',  // Red
  warning: '#d97706', // Orange
  info: '#0891b2',    // Cyan
};
```

**Focus Indicators:**
```css
/* Add visible focus styles */
.node:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Don't remove focus styles! */
.node:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Mobile Optimization

### Touch Gestures

```typescript
// Leaflet - built-in touch support
map.touchZoom.enable();
map.dragging.enable();

// D3 - add touch event handlers
svg.call(
  d3.zoom()
    .touchable(true)
    .on('zoom', handleZoom)
);

// React Flow - enable touch
<ReactFlow
  panOnDrag={[1, 2]} // Left and right click
  panOnScroll={true}
  zoomOnPinch={true}
/>
```

### Responsive Sizing

```typescript
// Use ResponsiveContainer for charts
<ResponsiveContainer width="100%" height={400}>
  <LineChart data={data}>
    {/* chart content */}
  </LineChart>
</ResponsiveContainer>

// Dynamic sizing with resize observer
const containerRef = useRef<HTMLDivElement>(null);
const [size, setSize] = useState({ width: 0, height: 0 });

useEffect(() => {
  if (!containerRef.current) return;

  const resizeObserver = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    setSize({ width, height });
  });

  resizeObserver.observe(containerRef.current);
  return () => resizeObserver.disconnect();
}, []);
```

---

## TypeScript Integration

### Leaflet Types

```typescript
import L from 'leaflet';
import { MapContainer, Marker, Popup } from 'react-leaflet';

interface MarkerData {
  id: string;
  position: L.LatLngExpression;
  name: string;
}

const markers: MarkerData[] = [
  { id: '1', position: [51.5, -0.09], name: 'London' }
];
```

### vis-timeline Types

```typescript
import { DataSet, Timeline } from 'vis-timeline/standalone';

interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  type?: 'point' | 'range' | 'box';
}

const items = new DataSet<TimelineItem>([
  { id: '1', content: 'Event 1', start: new Date(), type: 'point' }
]);
```

### React Flow Types

```typescript
import { Node, Edge } from '@xyflow/react';

interface CustomNodeData {
  label: string;
  type: string;
  imageUrl?: string;
}

const nodes: Node<CustomNodeData>[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'Node 1', type: 'character' },
    position: { x: 0, y: 0 }
  }
];
```

### D3 Types

```typescript
import * as d3 from 'd3';

interface TreeNodeData {
  name: string;
  children?: TreeNodeData[];
}

const root = d3.hierarchy<TreeNodeData>(data);
const treeLayout = d3.tree<TreeNodeData>();
```

---

## Conclusion

**Quick Recommendations:**

1. **Maps** → Leaflet (simplicity + performance)
2. **Timelines** → vis-timeline (flexible dates)
3. **Graphs** → React Flow (modern + performant)
4. **Trees** → D3 (customization + control)
5. **Charts** → Recharts (React-first + easy)

**When to Use D3 for Everything:**
- Maximum customization needed
- Building unique visualizations
- Team has D3 expertise
- Bundle size not a concern

**When to Use Specialized Libraries:**
- Faster development
- Standard use cases
- Smaller learning curve
- Better React integration
