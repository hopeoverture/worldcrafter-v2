# Conversational Widget Development Reference

Complete guide to building interactive React widgets for ChatGPT Apps SDK.

## Overview

Conversational widgets are interactive UI components that display in ChatGPT conversations. They enable rich, visual interactions beyond text-based responses.

**Widget Types:**
- **Inline Cards**: Small embedded components (300-400px)
- **Picture-in-Picture (PiP)**: Floating overlay (400-600px)
- **Fullscreen**: Full viewport takeover

**Key Features:**
- Built with React 19
- Single-file ESM bundles (< 100KB)
- `window.openai` API for ChatGPT communication
- Served as `text/html+skybridge` MIME type

## Widget Architecture

```
ChatGPT Conversation
    ↓
    <iframe src="https://worldcrafter.app/api/widgets/character-card.html">
        ↓
        Widget HTML Wrapper
            ↓
            React Component (bundled ESM)
                ↓
                window.openai API
                    ↓
                ChatGPT Bridge
```

## Getting Started

### 1. Create Widget Component

```tsx
// src/widgets/character-card.tsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Extend window with OpenAI API
declare global {
  interface Window {
    openai: {
      setWidgetState: (state: any) => void;
      callTool: (name: string, args: any) => Promise<any>;
      sendFollowUpMessage: (message: string) => void;
      navigate: (widgetUri: string, state?: any) => void;
    };
  }
}

interface CharacterCardProps {
  characterId: string;
  name: string;
  role?: string;
}

function CharacterCard() {
  const [character, setCharacter] = useState<CharacterCardProps | null>(null);

  useEffect(() => {
    // Listen for state updates from ChatGPT
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'widget-state') {
        setCharacter(event.data.state);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify ChatGPT widget is ready
    window.parent.postMessage({ type: 'widget-ready' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="character-card">
      <h3>{character?.name || 'Loading...'}</h3>
      {character?.role && <p>{character.role}</p>}
    </div>
  );
}

// Mount component
const root = createRoot(document.getElementById('root')!);
root.render(<CharacterCard />);
```

### 2. Configure Vite for Bundling

```typescript
// vite.config.widgets.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/widgets',
    rollupOptions: {
      input: {
        'character-card': resolve(__dirname, 'src/widgets/character-card.tsx'),
        'world-card': resolve(__dirname, 'src/widgets/world-card.tsx'),
      },
      output: {
        format: 'esm',
        entryFileNames: '[name].js',
      },
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
```

### 3. Build Widgets

```bash
npx vite build --config vite.config.widgets.ts
```

**Output:**
```
dist/widgets/
├── character-card.js
└── world-card.js
```

### 4. Generate HTML Wrappers

```bash
# Run bundling script
./scripts/bundle_widgets.sh
```

**Generated HTML:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>character-card</title>
  <base href="https://worldcrafter.app/">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/api/widgets/character-card.js"></script>
</body>
</html>
```

### 5. Serve Widgets

```typescript
// src/app/api/widgets/[name]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const widgetName = params.name.replace('.html', '');
  const widgetPath = join(process.cwd(), 'dist/widgets', `${widgetName}.html`);

  const html = await readFile(widgetPath, 'utf-8');

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html+skybridge',
      'Access-Control-Allow-Origin': 'https://chatgpt.com',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
```

## window.openai API

The `window.openai` object provides methods for widgets to communicate with ChatGPT.

### setWidgetState(state)

Update widget state (called by ChatGPT, not by widget).

**Usage:**
```typescript
// ChatGPT sends state to widget
window.openai.setWidgetState({
  characterId: '123',
  name: 'Aragorn',
  role: 'Ranger',
});

// Widget listens for state updates
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'widget-state') {
      setCharacter(event.data.state);
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### callTool(name, args)

Invoke an MCP tool from the widget.

**Usage:**
```typescript
const handleViewDetails = async () => {
  try {
    const result = await window.openai.callTool('get_character', {
      characterId: character.characterId,
    });
    console.log('Tool result:', result);
  } catch (error) {
    console.error('Tool call failed:', error);
  }
};
```

**Returns:**
```typescript
Promise<{
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
  }>;
}>
```

### sendFollowUpMessage(message)

Send a message to ChatGPT conversation.

**Usage:**
```typescript
const handleAddTrait = () => {
  window.openai.sendFollowUpMessage(
    `Add the trait "Brave" to ${character.name}`
  );
};
```

**Effect:**
- Message appears in ChatGPT conversation as if user typed it
- ChatGPT processes message and may call tools

### navigate(widgetUri, state)

Navigate to a different widget.

**Usage:**
```typescript
const handleViewRelationships = () => {
  window.openai.navigate('ui://widget/relationship-graph.html', {
    worldId: world.worldId,
    focusCharacterId: character.characterId,
  });
};
```

**Widget URI Format:**
- `ui://widget/<name>.html`: Inline card
- `ui://widget/<name>.html?mode=pip`: Picture-in-picture
- `ui://widget/<name>.html?mode=fullscreen`: Fullscreen

## Widget Display Modes

### Inline Card

**Dimensions**: 300-400px width, auto height
**Use Case**: Quick reference cards, summaries
**URI**: `ui://widget/character-card.html`

**Example:**
```tsx
function CharacterCard() {
  return (
    <div style={{ width: '350px', padding: '16px' }}>
      <h3>{character.name}</h3>
      <p>{character.role}</p>
    </div>
  );
}
```

### Picture-in-Picture (PiP)

**Dimensions**: 400-600px, resizable
**Use Case**: Detailed views, forms, graphs
**URI**: `ui://widget/character-sheet.html?mode=pip`

**Features:**
- Draggable
- Resizable
- Stays on top while scrolling
- Can minimize to corner

**Example:**
```tsx
function CharacterSheet() {
  return (
    <div style={{ width: '500px', height: '600px', padding: '24px' }}>
      <h2>{character.name}</h2>
      {/* Full character details */}
    </div>
  );
}
```

### Fullscreen

**Dimensions**: Full viewport
**Use Case**: Dashboards, maps, complex visualizations
**URI**: `ui://widget/world-dashboard.html?mode=fullscreen`

**Features:**
- Covers entire ChatGPT interface
- Escape key to close
- Header with close button

**Example:**
```tsx
function WorldDashboard() {
  return (
    <div style={{ minHeight: '100vh', padding: '32px' }}>
      <h1>{world.name}</h1>
      {/* Complex dashboard layout */}
    </div>
  );
}
```

## Styling Best Practices

### 1. Use Inline Styles or CSS-in-JS

Avoid external stylesheets (bundle size).

```tsx
// Inline styles
<div style={{ backgroundColor: '#f3f4f6', padding: '16px' }}>

// CSS-in-JS (styled-jsx)
<div className="card">
  <style jsx>{`
    .card {
      background: white;
      border-radius: 8px;
      padding: 16px;
    }
  `}</style>
</div>
```

### 2. Mobile-First Responsive

Widgets may render on mobile.

```tsx
<div style={{
  width: '100%',
  maxWidth: '400px',
  padding: '16px',
}}>
```

### 3. Dark Mode Support

Respect ChatGPT's theme.

```tsx
useEffect(() => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(isDark ? 'dark' : 'light');
}, []);
```

### 4. Accessibility

```tsx
<button
  aria-label="View character details"
  onClick={handleViewDetails}
>
  View Details
</button>
```

## State Management

### Initial State Loading

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'widget-state') {
      setData(event.data.state);
      setLoading(false);
    }

    if (event.data.type === 'widget-error') {
      setError(event.data.error);
      setLoading(false);
    }
  };

  window.addEventListener('message', handleMessage);

  // Request initial state
  window.parent.postMessage({ type: 'widget-ready' }, '*');

  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### Loading States

```tsx
if (loading) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}
```

### Error States

```tsx
if (error) {
  return (
    <div className="error">
      <p>Failed to load widget</p>
      <p className="error-message">{error}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```

### State Persistence

```typescript
// Save state to localStorage
useEffect(() => {
  if (data) {
    localStorage.setItem('widget-state', JSON.stringify(data));
  }
}, [data]);

// Restore state on mount
useEffect(() => {
  const saved = localStorage.getItem('widget-state');
  if (saved) {
    setData(JSON.parse(saved));
  }
}, []);
```

## Interactive Features

### Button Actions

```tsx
<button
  onClick={() => window.openai.callTool('update_character', {
    characterId: character.id,
    name: newName,
  })}
  className="btn-primary"
>
  Save Changes
</button>
```

### Form Inputs

```tsx
function EditCharacterForm() {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await window.openai.callTool('update_character', {
      characterId: character.id,
      name,
    });

    window.openai.sendFollowUpMessage('Character updated successfully!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Character name"
      />
      <button type="submit">Update</button>
    </form>
  );
}
```

### Search/Filter

```tsx
function CharacterList({ characters }: { characters: Character[] }) {
  const [query, setQuery] = useState('');

  const filtered = characters.filter((char) =>
    char.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search characters..."
      />
      <ul>
        {filtered.map((char) => (
          <li key={char.id}>{char.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Advanced Features

### Canvas Rendering

```tsx
import { useEffect, useRef } from 'react';

function RelationshipGraph({ nodes, links }: GraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    links.forEach((link) => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [nodes, links]);

  return <canvas ref={canvasRef} width={600} height={400} />;
}
```

### Real-Time Updates

```tsx
function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Listen for activity updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'activity-update') {
        setActivities((prev) => [event.data.activity, ...prev]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="activity-feed">
      {activities.map((activity) => (
        <div key={activity.id} className="activity-item">
          {activity.description}
        </div>
      ))}
    </div>
  );
}
```

### Progressive Loading

```tsx
function WorldDashboard() {
  const [data, setData] = useState<WorldData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    loadBasicData().then((basic) => {
      setData(basic);
      setLoading(false);

      // Load detailed data in background
      loadDetailedData().then((detailed) => {
        setData((prev) => ({ ...prev, ...detailed }));
      });
    });
  }, []);

  return (
    <div>
      {data && <BasicInfo data={data} />}
      {loading && <Spinner />}
      {data?.detailed && <DetailedView data={data.detailed} />}
    </div>
  );
}
```

## Performance Optimization

### 1. Code Splitting

Split large widgets into chunks.

```typescript
// vite.config.widgets.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'd3-vendor': ['d3-force', 'd3-scale'],
        },
      },
    },
  },
});
```

### 2. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';

const RelationshipGraph = lazy(() => import('./RelationshipGraph'));

function CharacterSheet() {
  return (
    <div>
      <BasicInfo />
      <Suspense fallback={<Spinner />}>
        <RelationshipGraph characterId={id} />
      </Suspense>
    </div>
  );
}
```

### 3. Memoization

```tsx
import { useMemo } from 'react';

function CharacterList({ characters, filter }: Props) {
  const filtered = useMemo(() => {
    return characters.filter((char) =>
      char.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [characters, filter]);

  return (
    <ul>
      {filtered.map((char) => (
        <CharacterItem key={char.id} character={char} />
      ))}
    </ul>
  );
}
```

### 4. Virtual Scrolling

```tsx
import { FixedSizeList } from 'react-window';

function LargeCharacterList({ characters }: Props) {
  return (
    <FixedSizeList
      height={600}
      itemCount={characters.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {characters[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

## Testing Widgets

### Unit Tests

```typescript
// src/widgets/__tests__/character-card.test.tsx
import { render, screen } from '@testing-library/react';
import CharacterCard from '../character-card';

describe('CharacterCard', () => {
  it('renders character name', () => {
    render(<CharacterCard />);

    // Simulate state update
    window.postMessage({
      type: 'widget-state',
      state: { name: 'Aragorn', role: 'Ranger' },
    }, '*');

    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Ranger')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// e2e/widgets.spec.ts
import { test, expect } from '@playwright/test';

test('character card widget', async ({ page }) => {
  await page.goto('http://localhost:3000/api/widgets/character-card.html');

  // Send state to widget
  await page.evaluate(() => {
    window.postMessage({
      type: 'widget-state',
      state: {
        characterId: '123',
        name: 'Aragorn',
        role: 'Ranger',
      },
    }, '*');
  });

  await expect(page.getByText('Aragorn')).toBeVisible();
  await expect(page.getByText('Ranger')).toBeVisible();
});
```

## Debugging

### Console Logging

```tsx
useEffect(() => {
  console.log('[Widget] State updated:', character);
}, [character]);

const handleAction = () => {
  console.log('[Widget] Action triggered');
  window.openai.callTool('update_character', args);
};
```

### React DevTools

Enable React DevTools in development:

```tsx
if (process.env.NODE_ENV === 'development') {
  // React DevTools will connect automatically
}
```

### Network Monitoring

Monitor tool calls in browser DevTools:

```tsx
const callToolWithLogging = async (name: string, args: any) => {
  console.log(`[Widget] Calling tool: ${name}`, args);
  const result = await window.openai.callTool(name, args);
  console.log(`[Widget] Tool result:`, result);
  return result;
};
```

## Bundle Size Optimization

### Target: < 100KB per widget

**Techniques:**
1. Tree shaking (remove unused code)
2. Minification (Terser)
3. Gzip compression
4. Avoid large dependencies

**Check bundle size:**
```bash
ls -lh dist/widgets/*.js
# character-card.js: 45KB
# world-dashboard.js: 87KB
```

**Analyze bundle:**
```bash
npx vite-bundle-visualizer --config vite.config.widgets.ts
```

## Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [ChatGPT Apps SDK Reference](https://platform.openai.com/docs/chatgpt-apps)
- [MessageChannel API](https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel)
