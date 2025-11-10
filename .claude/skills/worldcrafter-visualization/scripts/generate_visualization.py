#!/usr/bin/env python3
"""
WorldCrafter Visualization Generator

This script helps generate boilerplate code for new visualizations.
Prompts user for visualization details and creates necessary files.

Usage:
    python generate_visualization.py
"""

import os
import sys
from pathlib import Path
from typing import Dict, List


def get_skill_root() -> Path:
    """Get the root directory of the worldcrafter-visualization skill."""
    return Path(__file__).parent.parent


def prompt_user() -> Dict[str, str]:
    """Prompt user for visualization details."""
    print("WorldCrafter Visualization Generator")
    print("=" * 50)
    print()

    config = {}

    # Visualization name
    config['name'] = input("Visualization name (e.g., 'Heat Map'): ").strip()
    config['slug'] = config['name'].lower().replace(' ', '-')

    # Description
    config['description'] = input("Brief description: ").strip()

    # Library choice
    print("\nVisualization library:")
    print("1. Leaflet (Maps)")
    print("2. vis-timeline (Timelines)")
    print("3. React Flow (Graphs)")
    print("4. D3 (Trees, Custom)")
    print("5. Recharts (Charts)")
    print("6. Custom")

    library_choice = input("Choose library (1-6): ").strip()
    library_map = {
        '1': 'leaflet',
        '2': 'vis-timeline',
        '3': 'react-flow',
        '4': 'd3',
        '5': 'recharts',
        '6': 'custom'
    }
    config['library'] = library_map.get(library_choice, 'custom')

    # Data source
    config['entity_type'] = input("Primary entity type (e.g., 'character', 'location'): ").strip()

    # Export formats
    print("\nSupported export formats (comma-separated, e.g., 'png,svg,csv'):")
    exports = input("Formats: ").strip().lower()
    config['exports'] = [fmt.strip() for fmt in exports.split(',')]

    return config


def generate_component(config: Dict[str, str]) -> str:
    """Generate React component code."""
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())

    component = f"""'use client';

import {{ useEffect, useRef, useState }} from 'react';
import {{ useQuery, useMutation, useQueryClient }} from '@tanstack/react-query';
import {{ Button }} from '@/components/ui/button';
import {{ Download }} from 'lucide-react';
import {{ toast }} from 'sonner';

interface {name_pascal}Props {{
  worldId: string;
  // Add additional props as needed
}}

export default function {name_pascal}({{
  worldId
}}: {name_pascal}Props) {{
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data
  const {{ data, isLoading: queryLoading }} = useQuery({{
    queryKey: ['{config['slug']}', worldId],
    queryFn: async () => {{
      const response = await fetch(`/api/worlds/${{worldId}}/{config['slug']}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    }},
    refetchInterval: 30000 // Refresh every 30s
  }});

  // Initialize visualization
  useEffect(() => {{
    if (!containerRef.current || !data) return;

    // TODO: Initialize {config['library']} visualization
    console.log('Initializing {config['name']} with data:', data);

    setIsLoading(false);

    return () => {{
      // Cleanup
    }};
  }}, [data]);

  // Export functionality
  const handleExport = async () => {{
    if (!containerRef.current) return;

    try {{
      // TODO: Implement export logic
      toast.success('Exported successfully');
    }} catch (error) {{
      toast.error('Failed to export');
      console.error(error);
    }}
  }};

  if (queryLoading) {{
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }}

  if (!data) {{
    return <div className="flex items-center justify-center h-96">No data available</div>;
  }}

  return (
    <div className="space-y-4">
      {{/* Toolbar */}}
      <div className="flex items-center gap-2">
        <Button onClick={{handleExport}} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        {{/* Add additional controls */}}
      </div>

      {{/* Visualization Container */}}
      <div
        ref={{containerRef}}
        className="w-full h-[600px] rounded-lg border bg-white dark:bg-slate-900"
      />

      {{/* Legend or additional info */}}
      <div className="text-sm text-muted-foreground">
        {{/* Add legend or metadata */}}
      </div>
    </div>
  );
}}
"""
    return component


def generate_actions(config: Dict[str, str]) -> str:
    """Generate Server Actions code."""
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())

    actions = f"""\"use server\";

import {{ createClient }} from '@/lib/supabase/server';
import {{ prisma }} from '@/lib/prisma';
import {{ revalidatePath }} from 'next/cache';
import {{ z }} from 'zod';

// Types
export interface {name_pascal}Data {{
  id: string;
  // Add fields as needed
}}

// Schemas
const create{name_pascal}Schema = z.object({{
  worldId: z.string(),
  // Add validation rules
}});

// Actions
export async function get{name_pascal}Data(worldId: string) {{
  const supabase = await createClient();
  const {{ data: {{ user }} }} = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify user has access to world
  const world = await prisma.world.findFirst({{
    where: {{ id: worldId, userId: user.id }}
  }});
  if (!world) throw new Error('World not found');

  // Fetch data
  const data = await prisma.{config['entity_type']}.findMany({{
    where: {{ worldId }}
  }});

  return data;
}}

export async function create{name_pascal}Item(values: z.infer<typeof create{name_pascal}Schema>) {{
  const validated = create{name_pascal}Schema.parse(values);

  const supabase = await createClient();
  const {{ data: {{ user }} }} = await supabase.auth.getUser();
  if (!user) return {{ success: false, error: 'Unauthorized' }};

  // Create item
  const item = await prisma.{config['entity_type']}.create({{
    data: {{
      ...validated,
      userId: user.id
    }}
  }});

  revalidatePath(`/worlds/${{validated.worldId}}/{config['slug']}`);
  return {{ success: true, data: item }};
}}

export async function delete{name_pascal}Item(id: string) {{
  const supabase = await createClient();
  const {{ data: {{ user }} }} = await supabase.auth.getUser();
  if (!user) return {{ success: false, error: 'Unauthorized' }};

  await prisma.{config['entity_type']}.delete({{
    where: {{ id, userId: user.id }}
  }});

  return {{ success: true }};
}}
"""
    return actions


def generate_api_route(config: Dict[str, str]) -> str:
    """Generate API route code."""
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())

    route = f"""import {{ NextRequest, NextResponse }} from 'next/server';
import {{ createClient }} from '@/lib/supabase/server';
import {{ prisma }} from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  {{ params }}: {{ params: {{ worldId: string }} }}
) {{
  try {{
    const supabase = await createClient();
    const {{ data: {{ user }} }} = await supabase.auth.getUser();

    if (!user) {{
      return NextResponse.json(
        {{ error: 'Unauthorized' }},
        {{ status: 401 }}
      );
    }}

    // Verify user has access to world
    const world = await prisma.world.findFirst({{
      where: {{ id: params.worldId, userId: user.id }}
    }});

    if (!world) {{
      return NextResponse.json(
        {{ error: 'World not found' }},
        {{ status: 404 }}
      );
    }}

    // Fetch {config['name']} data
    const data = await prisma.{config['entity_type']}.findMany({{
      where: {{ worldId: params.worldId }}
    }});

    return NextResponse.json(data);
  }} catch (error) {{
    console.error('Error fetching {config['slug']} data:', error);
    return NextResponse.json(
      {{ error: 'Internal server error' }},
      {{ status: 500 }}
    );
  }}
}}
"""
    return route


def generate_schema(config: Dict[str, str]) -> str:
    """Generate Prisma schema snippet."""
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())

    schema = f"""
// Add to prisma/schema.prisma

model {name_pascal} {{
  id          String   @id @default(cuid())
  worldId     String   @map("world_id")
  name        String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  userId      String   @map("user_id")

  world       World    @relation(fields: [worldId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@map("{config['slug'].replace('-', '_')}s")
}}

// After adding, run:
// npx prisma migrate dev --name add_{config['slug'].replace('-', '_')}
// npm run db:rls
"""
    return schema


def generate_documentation(config: Dict[str, str]) -> str:
    """Generate documentation."""
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())

    doc = f"""# {config['name']} Visualization

## Overview

{config['description']}

**Library:** {config['library']}
**Entity Type:** {config['entity_type']}
**Export Formats:** {', '.join(config['exports'])}

## Installation

```bash
# Install required dependencies
npm install {get_library_package(config['library'])}
```

## Database Schema

See `schema.prisma.txt` for the database schema.

After adding the schema:

```bash
npx prisma migrate dev --name add_{config['slug'].replace('-', '_')}
npm run db:rls
npx prisma generate
```

## Component Usage

```typescript
import {name_pascal} from '@/components/visualizations/{name_pascal}';

export default function Page() {{
  return (
    <{name_pascal} worldId={{worldId}} />
  );
}}
```

## API Endpoints

- `GET /api/worlds/[worldId]/{config['slug']}` - Fetch data
- `POST /api/worlds/[worldId]/{config['slug']}` - Create item
- `DELETE /api/worlds/[worldId]/{config['slug']}/[id]` - Delete item

## Server Actions

```typescript
import {{ get{name_pascal}Data, create{name_pascal}Item }} from './actions';

// Fetch data
const data = await get{name_pascal}Data(worldId);

// Create item
const result = await create{name_pascal}Item({{
  worldId,
  name: "Example",
  // ...
}});
```

## Features

- Real-time updates via TanStack Query
- Export to {', '.join(config['exports']).upper()}
- Responsive design
- Dark mode support
- Accessibility (ARIA labels, keyboard navigation)

## Customization

TODO: Add customization instructions

## Testing

```typescript
// Add tests in __tests__/{config['slug']}.test.ts
describe('{name_pascal}', () => {{
  it('should render visualization', () => {{
    // Test implementation
  }});
}});
```

## Troubleshooting

### Common Issues

TODO: Add common issues and solutions

## Next Steps

1. Implement data transformation logic
2. Add interactive features
3. Implement export functionality
4. Add tests
5. Document customization options
"""
    return doc


def get_library_package(library: str) -> str:
    """Get npm package name for library."""
    packages = {
        'leaflet': 'leaflet react-leaflet @types/leaflet',
        'vis-timeline': 'vis-timeline vis-data',
        'react-flow': '@xyflow/react',
        'd3': 'd3 @types/d3',
        'recharts': 'recharts',
        'custom': '# No additional packages needed'
    }
    return packages.get(library, '')


def create_files(config: Dict[str, str]) -> None:
    """Create all necessary files."""
    skill_root = get_skill_root()
    name_pascal = ''.join(word.capitalize() for word in config['name'].split())
    slug = config['slug']

    # Create output directory
    output_dir = skill_root / 'generated' / slug
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate files
    files = {
        f'{name_pascal}.tsx': generate_component(config),
        'actions.ts': generate_actions(config),
        'route.ts': generate_api_route(config),
        'schema.prisma.txt': generate_schema(config),
        'README.md': generate_documentation(config),
    }

    # Write files
    for filename, content in files.items():
        filepath = output_dir / filename
        filepath.write_text(content)
        print(f"Created: {filepath}")

    print()
    print("=" * 50)
    print("Generation complete!")
    print()
    print("Next steps:")
    print(f"1. Review generated files in: {output_dir}")
    print(f"2. Add schema to prisma/schema.prisma")
    print(f"3. Run: npx prisma migrate dev --name add_{slug.replace('-', '_')}")
    print(f"4. Run: npm run db:rls")
    print(f"5. Install dependencies: npm install {get_library_package(config['library'])}")
    print(f"6. Move {name_pascal}.tsx to src/components/visualizations/")
    print(f"7. Move actions.ts to appropriate location")
    print(f"8. Create route file at src/app/api/worlds/[worldId]/{slug}/route.ts")
    print()


def main():
    """Main entry point."""
    try:
        config = prompt_user()
        print()
        print("Generating files...")
        print()
        create_files(config)
    except KeyboardInterrupt:
        print("\n\nAborted.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
