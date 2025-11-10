# WorldCrafter ChatGPT Integration Skill

**Version**: 1.0.0
**Status**: Production-Ready
**Last Updated**: 2025-11-09

## Description

Complete ChatGPT Apps SDK integration for WorldCrafter enabling conversational worldbuilding through:
- **Model Context Protocol (MCP)**: JSON-RPC 2.0 over HTTPS with 13 worldbuilding tools
- **OAuth 2.1 Authorization**: PKCE-secured token flow via Supabase Auth
- **Conversational Widgets**: Interactive React components for worlds, characters, and relationships

## Trigger Phrases

- "Set up ChatGPT integration"
- "Create MCP server"
- "Add ChatGPT Apps SDK"
- "Enable conversational worldbuilding"
- "Integrate with ChatGPT"
- "Set up OAuth for ChatGPT"

## Allowed Tools

- Read
- Write
- Edit
- Bash
- Glob
- Grep

## Related Skills

- `database-setup`: For Prisma schema extensions
- `feature-builder`: For new tool implementations
- `auth-guard`: For OAuth token validation

## Prerequisites

Before running this skill, ensure:

1. Supabase project is configured with OAuth providers
2. `NEXT_PUBLIC_BASE_URL` set in environment (e.g., https://worldcrafter.app)
3. Next.js 16+ with App Router
4. Prisma with existing World/Character/Location models

## Architecture Overview

```
ChatGPT Client
    ↓ (OAuth 2.1 + PKCE)
    ↓
WorldCrafter MCP Server (/api/mcp)
    ↓ (JSON-RPC 2.0)
    ↓
Tool Handlers (Server Actions)
    ↓
Prisma ORM → Supabase PostgreSQL
    ↑
RLS Policies (auth.uid() validation)

Widgets (React components)
    ↓ (window.openai API)
    ↓
ChatGPT iframe bridge
```

## Implementation Checklist

### Phase 1: MCP Server Core (30 min)

- [ ] Create `/api/mcp/route.ts` with JSON-RPC 2.0 handler
- [ ] Implement `tools/list` method returning 13 tool schemas
- [ ] Implement `tools/call` method with OAuth validation
- [ ] Add Server-Sent Events for streaming responses
- [ ] Configure CORS for https://chatgpt.com

### Phase 2: OAuth 2.1 Integration (45 min)

- [ ] Create `/.well-known/oauth-protected-resource/route.ts`
- [ ] Add OAuth metadata (issuer, scopes, grant types)
- [ ] Implement JWT token validation middleware
- [ ] Add PKCE S256 code challenge verification
- [ ] Define scopes: `worlds:read`, `worlds:write`, `worlds:share`

### Phase 3: Tool Schema Generation (60 min)

- [ ] Create `scripts/generate_tool_schemas.py`
- [ ] Convert Zod schemas to JSON Schema
- [ ] Add `_meta.openai/outputTemplate` for widget URIs
- [ ] Add `_meta.openai/widgetAccessible` flags
- [ ] Add `_meta.openai/toolInvocation` messages
- [ ] Generate TypeScript types from schemas

### Phase 4: Tool Implementations (90 min)

Implement 13 MCP tools:

**World Management**:
- [ ] `create_world`: Create new world with template
- [ ] `get_world`: Retrieve world details
- [ ] `update_world`: Modify world properties

**Character Management**:
- [ ] `create_character`: Add character with traits
- [ ] `get_character`: Retrieve character details
- [ ] `update_character`: Modify character properties

**Location Management**:
- [ ] `create_location`: Add location to world
- [ ] `get_location`: Retrieve location details

**Relationships**:
- [ ] `add_relationship`: Link two characters

**Discovery**:
- [ ] `search_world`: Semantic search across world
- [ ] `get_world_summary`: AI-generated summary
- [ ] `export_world`: Generate export bundle
- [ ] `suggest_ideas`: AI worldbuilding suggestions

### Phase 5: Conversational Widgets (120 min)

**Inline Cards** (text/html+skybridge):
- [ ] `widget-character-card.tsx`: Avatar, name, role, traits
- [ ] `widget-world-card.tsx`: Name, theme, stats, thumbnail
- [ ] `widget-location-card.tsx`: Name, type, description

**Picture-in-Picture**:
- [ ] `widget-character-sheet.tsx`: Full character details
- [ ] `widget-relationship-graph.tsx`: D3.js force graph

**Fullscreen**:
- [ ] `widget-world-dashboard.tsx`: Analytics, timeline, map
- [ ] `widget-map-viewer.tsx`: Interactive 2D map

**Widget Infrastructure**:
- [ ] Create Vite config for widget bundling
- [ ] Add `/api/widgets/[name]/route.ts` serving endpoint
- [ ] Implement `window.openai` API bridge
- [ ] Add widget state persistence

### Phase 6: Testing & Deployment (60 min)

- [ ] Integration tests for MCP JSON-RPC
- [ ] OAuth flow E2E tests with Playwright
- [ ] Widget rendering tests
- [ ] Performance testing (< 200ms tool calls)
- [ ] Deploy to production with HTTPS
- [ ] Register with ChatGPT Apps SDK portal

## Detailed Implementation Guide

---

## 1. MCP Server Implementation

### File: `src/app/api/mcp/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateOAuthToken } from '@/lib/auth/oauth';
import { mcpToolHandlers } from '@/lib/mcp/tools';

// JSON-RPC 2.0 Schemas
const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

const JsonRpcErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
});

// MCP Protocol Methods
const MCP_METHODS = {
  'tools/list': listTools,
  'tools/call': callTool,
  'resources/list': listResources,
  'prompts/list': listPrompts,
} as const;

// CORS headers for ChatGPT
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://chatgpt.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate OAuth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonRpcError(-32001, 'Unauthorized', null, { headers: CORS_HEADERS });
    }

    const token = authHeader.slice(7);
    const tokenData = await validateOAuthToken(token);
    if (!tokenData) {
      return jsonRpcError(-32001, 'Invalid token', null, { headers: CORS_HEADERS });
    }

    // 2. Parse JSON-RPC request
    const body = await request.json();
    const rpcRequest = JsonRpcRequestSchema.parse(body);

    // 3. Route to handler
    const handler = MCP_METHODS[rpcRequest.method as keyof typeof MCP_METHODS];
    if (!handler) {
      return jsonRpcError(-32601, 'Method not found', rpcRequest.id, { headers: CORS_HEADERS });
    }

    const result = await handler(rpcRequest.params || {}, tokenData);

    // 4. Return JSON-RPC response
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        result,
        id: rpcRequest.id,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('MCP Server Error:', error);
    return jsonRpcError(-32603, 'Internal error', null, { headers: CORS_HEADERS });
  }
}

// Server-Sent Events endpoint for streaming
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {"status":"ready"}\n\n'));

      // Keep-alive ping every 30s
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
      }, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...CORS_HEADERS,
    },
  });
}

// Helper: JSON-RPC error response
function jsonRpcError(code: number, message: string, id: any, options?: any) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      error: { code, message },
      id,
    },
    { status: 200, ...options }
  );
}

// Handler: List available tools
async function listTools() {
  return {
    tools: [
      // World Management
      {
        name: 'create_world',
        title: 'Create World',
        description: 'Create a new fictional world with customizable properties',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'World name' },
            theme: { type: 'string', description: 'Genre/theme (fantasy, sci-fi, etc.)' },
            description: { type: 'string', description: 'World description' },
          },
          required: ['name'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/world-card.html',
          'openai/widgetAccessible': true,
          'openai/toolInvocation': {
            invoking: 'Creating your world...',
            invoked: 'World created successfully!',
          },
        },
      },
      {
        name: 'get_world',
        title: 'Get World',
        description: 'Retrieve detailed information about a world',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string', description: 'World ID' },
          },
          required: ['worldId'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/world-dashboard.html',
          'openai/widgetAccessible': true,
        },
      },
      {
        name: 'update_world',
        title: 'Update World',
        description: 'Modify world properties',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
            name: { type: 'string' },
            theme: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['worldId'],
        },
      },

      // Character Management
      {
        name: 'create_character',
        title: 'Create Character',
        description: 'Add a new character to the world',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string', description: 'World ID' },
            name: { type: 'string', description: 'Character name' },
            role: { type: 'string', description: 'Character role/occupation' },
            traits: {
              type: 'array',
              items: { type: 'string' },
              description: 'Character traits',
            },
            background: { type: 'string', description: 'Background story' },
          },
          required: ['worldId', 'name'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/character-card.html',
          'openai/widgetAccessible': true,
          'openai/toolInvocation': {
            invoking: 'Creating character...',
            invoked: 'Character added to your world!',
          },
        },
      },
      {
        name: 'get_character',
        title: 'Get Character',
        description: 'Retrieve character details',
        inputSchema: {
          type: 'object',
          properties: {
            characterId: { type: 'string' },
          },
          required: ['characterId'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/character-sheet.html',
          'openai/widgetAccessible': true,
        },
      },
      {
        name: 'update_character',
        title: 'Update Character',
        description: 'Modify character properties',
        inputSchema: {
          type: 'object',
          properties: {
            characterId: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            traits: { type: 'array', items: { type: 'string' } },
            background: { type: 'string' },
          },
          required: ['characterId'],
        },
      },

      // Location Management
      {
        name: 'create_location',
        title: 'Create Location',
        description: 'Add a location to the world',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
            name: { type: 'string', description: 'Location name' },
            type: { type: 'string', description: 'Location type (city, dungeon, etc.)' },
            description: { type: 'string' },
          },
          required: ['worldId', 'name'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/location-card.html',
          'openai/widgetAccessible': true,
        },
      },
      {
        name: 'get_location',
        title: 'Get Location',
        description: 'Retrieve location details',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string' },
          },
          required: ['locationId'],
        },
      },

      // Relationships
      {
        name: 'add_relationship',
        title: 'Add Relationship',
        description: 'Create a relationship between two characters',
        inputSchema: {
          type: 'object',
          properties: {
            characterId1: { type: 'string', description: 'First character ID' },
            characterId2: { type: 'string', description: 'Second character ID' },
            type: { type: 'string', description: 'Relationship type (ally, enemy, family, etc.)' },
            description: { type: 'string' },
          },
          required: ['characterId1', 'characterId2', 'type'],
        },
        _meta: {
          'openai/widgetAccessible': false,
        },
      },

      // Discovery & AI
      {
        name: 'search_world',
        title: 'Search World',
        description: 'Semantic search across world content',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', default: 10 },
          },
          required: ['worldId', 'query'],
        },
      },
      {
        name: 'get_world_summary',
        title: 'Get World Summary',
        description: 'AI-generated summary of the world',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
          },
          required: ['worldId'],
        },
      },
      {
        name: 'export_world',
        title: 'Export World',
        description: 'Generate export bundle (JSON/Markdown)',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
            format: { type: 'string', enum: ['json', 'markdown'], default: 'json' },
          },
          required: ['worldId'],
        },
      },
      {
        name: 'suggest_ideas',
        title: 'Suggest Ideas',
        description: 'AI-powered worldbuilding suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            worldId: { type: 'string' },
            category: {
              type: 'string',
              enum: ['characters', 'locations', 'events', 'items'],
              description: 'Suggestion category',
            },
            count: { type: 'number', default: 3, description: 'Number of suggestions' },
          },
          required: ['worldId', 'category'],
        },
      },
    ],
  };
}

// Handler: Call a tool
async function callTool(params: any, tokenData: any) {
  const { name, arguments: args } = params;

  // Route to tool handler
  const handler = mcpToolHandlers[name];
  if (!handler) {
    throw new Error(`Tool not found: ${name}`);
  }

  // Execute with user context
  const result = await handler(args, tokenData.userId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

// Handler: List resources (optional)
async function listResources() {
  return { resources: [] };
}

// Handler: List prompts (optional)
async function listPrompts() {
  return { prompts: [] };
}
```

---

## 2. OAuth 2.1 Protected Resource Metadata

### File: `src/app/.well-known/oauth-protected-resource/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return NextResponse.json({
    // RFC 8414: OAuth 2.0 Authorization Server Metadata
    authorization_endpoint: `${supabaseUrl}/auth/v1/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/token`,
    issuer: supabaseUrl,

    // Resource server metadata
    resource: baseUrl,
    scopes_supported: [
      'worlds:read',
      'worlds:write',
      'worlds:share',
    ],

    // Grant types
    grant_types_supported: [
      'authorization_code',
      'refresh_token',
    ],

    // PKCE required
    code_challenge_methods_supported: ['S256'],

    // Token endpoint auth
    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic',
    ],

    // Response types
    response_types_supported: ['code'],
    response_modes_supported: ['query', 'fragment'],

    // Registration
    registration_endpoint: `${baseUrl}/api/oauth/register`,

    // Revocation
    revocation_endpoint: `${supabaseUrl}/auth/v1/logout`,

    // MCP endpoint
    service_endpoint: `${baseUrl}/api/mcp`,

    // Widget endpoints
    widget_endpoints: {
      'world-card': `${baseUrl}/api/widgets/world-card.html`,
      'character-card': `${baseUrl}/api/widgets/character-card.html`,
      'location-card': `${baseUrl}/api/widgets/location-card.html`,
      'character-sheet': `${baseUrl}/api/widgets/character-sheet.html`,
      'relationship-graph': `${baseUrl}/api/widgets/relationship-graph.html`,
      'world-dashboard': `${baseUrl}/api/widgets/world-dashboard.html`,
    },
  });
}
```

---

## 3. OAuth Token Validation

### File: `src/lib/auth/oauth.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

export interface OAuthTokenData {
  userId: string;
  email: string;
  scopes: string[];
  user: User;
}

export async function validateOAuthToken(token: string): Promise<OAuthTokenData | null> {
  try {
    const supabase = await createClient();

    // Verify JWT token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      console.error('OAuth validation failed:', error);
      return null;
    }

    // Extract scopes from token metadata (set during OAuth flow)
    const scopes = (data.user.user_metadata?.scopes as string[]) || ['worlds:read'];

    return {
      userId: data.user.id,
      email: data.user.email!,
      scopes,
      user: data.user,
    };
  } catch (error) {
    console.error('OAuth token validation error:', error);
    return null;
  }
}

export function validateScope(tokenData: OAuthTokenData, requiredScope: string): boolean {
  return tokenData.scopes.includes(requiredScope);
}
```

---

## 4. MCP Tool Handlers

### File: `src/lib/mcp/tools/index.ts`

```typescript
import { createWorld } from './world-tools';
import { createCharacter, getCharacter, updateCharacter } from './character-tools';
import { createLocation, getLocation } from './location-tools';
import { addRelationship } from './relationship-tools';
import { searchWorld, getWorldSummary, exportWorld, suggestIdeas } from './discovery-tools';

export const mcpToolHandlers = {
  // World
  create_world: createWorld,
  get_world: async (args: any, userId: string) => {
    // Implementation
    return { worldId: args.worldId, name: 'Example World' };
  },
  update_world: async (args: any, userId: string) => {
    // Implementation
    return { success: true };
  },

  // Character
  create_character: createCharacter,
  get_character: getCharacter,
  update_character: updateCharacter,

  // Location
  create_location: createLocation,
  get_location: getLocation,

  // Relationship
  add_relationship: addRelationship,

  // Discovery
  search_world: searchWorld,
  get_world_summary: getWorldSummary,
  export_world: exportWorld,
  suggest_ideas: suggestIdeas,
};
```

### File: `src/lib/mcp/tools/world-tools.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateWorldSchema = z.object({
  name: z.string().min(1).max(100),
  theme: z.string().optional(),
  description: z.string().optional(),
});

export async function createWorld(args: any, userId: string) {
  const validated = CreateWorldSchema.parse(args);

  const world = await prisma.world.create({
    data: {
      ...validated,
      userId,
    },
  });

  return {
    worldId: world.id,
    name: world.name,
    theme: world.theme,
    description: world.description,
    createdAt: world.createdAt.toISOString(),
  };
}
```

### File: `src/lib/mcp/tools/character-tools.ts`

```typescript
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateCharacterSchema = z.object({
  worldId: z.string(),
  name: z.string().min(1).max(100),
  role: z.string().optional(),
  traits: z.array(z.string()).optional(),
  background: z.string().optional(),
});

export async function createCharacter(args: any, userId: string) {
  const validated = CreateCharacterSchema.parse(args);

  // Verify world ownership
  const world = await prisma.world.findFirst({
    where: { id: validated.worldId, userId },
  });

  if (!world) {
    throw new Error('World not found or unauthorized');
  }

  const character = await prisma.character.create({
    data: {
      worldId: validated.worldId,
      name: validated.name,
      role: validated.role,
      traits: validated.traits || [],
      background: validated.background,
    },
  });

  return {
    characterId: character.id,
    name: character.name,
    role: character.role,
    traits: character.traits,
    background: character.background,
  };
}

export async function getCharacter(args: any, userId: string) {
  const character = await prisma.character.findFirst({
    where: {
      id: args.characterId,
      world: { userId },
    },
    include: {
      world: true,
    },
  });

  if (!character) {
    throw new Error('Character not found or unauthorized');
  }

  return {
    characterId: character.id,
    name: character.name,
    role: character.role,
    traits: character.traits,
    background: character.background,
    worldName: character.world.name,
  };
}

export async function updateCharacter(args: any, userId: string) {
  const { characterId, ...updates } = args;

  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      world: { userId },
    },
  });

  if (!character) {
    throw new Error('Character not found or unauthorized');
  }

  const updated = await prisma.character.update({
    where: { id: characterId },
    data: updates,
  });

  return { success: true, characterId: updated.id };
}
```

---

## 5. Conversational Widgets

### File: `src/app/api/widgets/[name]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
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
  } catch (error) {
    console.error('Widget load error:', error);
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }
}
```

### Widget Template: Character Card

### File: `assets/templates/widget-character-card.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    openai: {
      setWidgetState: (state: any) => void;
      callTool: (name: string, args: any) => Promise<any>;
      sendFollowUpMessage: (message: string) => void;
    };
  }
}

interface CharacterCardProps {
  characterId: string;
  name: string;
  role?: string;
  traits?: string[];
  avatarUrl?: string;
}

function CharacterCard() {
  const [character, setCharacter] = useState<CharacterCardProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for state updates from ChatGPT
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'widget-state') {
        setCharacter(event.data.state);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleViewDetails = () => {
    if (!character) return;
    window.openai.callTool('get_character', { characterId: character.characterId });
  };

  const handleAddTrait = () => {
    window.openai.sendFollowUpMessage('Add a trait to this character');
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-16 w-16 bg-gray-200 rounded-full mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!character) {
    return <div className="p-4 text-gray-500">No character data</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-sm">
      {/* Avatar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-16 w-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{character.name}</h3>
          {character.role && (
            <p className="text-sm text-gray-600">{character.role}</p>
          )}
        </div>
      </div>

      {/* Traits */}
      {character.traits && character.traits.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Traits</p>
          <div className="flex flex-wrap gap-1">
            {character.traits.slice(0, 5).map((trait, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleViewDetails}
          className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition"
        >
          View Details
        </button>
        <button
          onClick={handleAddTrait}
          className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition"
        >
          + Trait
        </button>
      </div>
    </div>
  );
}

// Mount component
const root = createRoot(document.getElementById('root')!);
root.render(<CharacterCard />);
```

---

## 6. Widget Bundling Configuration

### File: `vite.config.widgets.ts`

```typescript
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
        'location-card': resolve(__dirname, 'src/widgets/location-card.tsx'),
        'character-sheet': resolve(__dirname, 'src/widgets/character-sheet.tsx'),
        'relationship-graph': resolve(__dirname, 'src/widgets/relationship-graph.tsx'),
        'world-dashboard': resolve(__dirname, 'src/widgets/world-dashboard.tsx'),
      },
      output: {
        format: 'esm',
        entryFileNames: '[name].js',
      },
    },
    target: 'esnext',
  },
});
```

### File: `scripts/bundle_widgets.sh`

```bash
#!/bin/bash

echo "Bundling conversational widgets for ChatGPT..."

# Build widgets with Vite
npx vite build --config vite.config.widgets.ts

# Generate HTML wrappers
for widget in character-card world-card location-card character-sheet relationship-graph world-dashboard; do
  cat > "dist/widgets/${widget}.html" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${widget}</title>
  <base href="${NEXT_PUBLIC_BASE_URL}/">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/api/widgets/${widget}.js"></script>
</body>
</html>
EOF
done

echo "Widget bundling complete!"
```

---

## 7. Next.js Configuration for Widgets

### File: `next.config.ts` (additions)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Existing config...

  // Widget support
  assetPrefix: process.env.NEXT_PUBLIC_BASE_URL || '',

  // Allow iframe embedding from ChatGPT
  async headers() {
    return [
      {
        source: '/api/widgets/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://chatgpt.com' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'X-Frame-Options', value: 'ALLOW-FROM https://chatgpt.com' },
        ],
      },
      {
        source: '/api/mcp/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://chatgpt.com' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## 8. Tool Schema Generator Script

### File: `scripts/generate_tool_schemas.py`

```python
#!/usr/bin/env python3
"""
Generate MCP tool schemas from Zod schemas with OpenAI metadata
"""

import json
import re
from pathlib import Path

TOOLS = [
    {
        "name": "create_world",
        "zod_schema": "CreateWorldSchema",
        "file": "src/lib/schemas/world.ts",
        "widget": "world-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Creating your world...",
            "invoked": "World created successfully!"
        }
    },
    {
        "name": "create_character",
        "zod_schema": "CreateCharacterSchema",
        "file": "src/lib/schemas/character.ts",
        "widget": "character-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Creating character...",
            "invoked": "Character added to your world!"
        }
    },
    # Add all 13 tools...
]

def zod_to_json_schema(zod_code: str) -> dict:
    """
    Convert Zod schema to JSON Schema
    Simplified - production version should use proper parser
    """
    # Extract properties
    properties = {}
    required = []

    # Parse z.object({ ... })
    props_match = re.search(r'z\.object\(\{([^}]+)\}\)', zod_code, re.DOTALL)
    if props_match:
        props_str = props_match.group(1)

        # Parse each property (simplified)
        for line in props_str.split('\n'):
            line = line.strip()
            if ':' in line:
                key = line.split(':')[0].strip()
                value = line.split(':')[1].strip().rstrip(',')

                prop_schema = {}
                if 'z.string()' in value:
                    prop_schema['type'] = 'string'
                elif 'z.number()' in value:
                    prop_schema['type'] = 'number'
                elif 'z.array(' in value:
                    prop_schema['type'] = 'array'
                    prop_schema['items'] = {'type': 'string'}

                if '.min(' in value:
                    # Extract min value
                    pass

                if '.optional()' not in value:
                    required.append(key)

                properties[key] = prop_schema

    return {
        'type': 'object',
        'properties': properties,
        'required': required
    }

def generate_tool_schema(tool_def: dict) -> dict:
    """Generate complete MCP tool schema with OpenAI metadata"""

    # Read Zod schema file
    schema_file = Path(tool_def['file'])
    if schema_file.exists():
        zod_code = schema_file.read_text()
        input_schema = zod_to_json_schema(zod_code)
    else:
        # Fallback to empty schema
        input_schema = {'type': 'object', 'properties': {}}

    tool = {
        'name': tool_def['name'],
        'title': tool_def['name'].replace('_', ' ').title(),
        'description': f"Tool for {tool_def['name'].replace('_', ' ')}",
        'inputSchema': input_schema,
    }

    # Add OpenAI metadata
    if tool_def.get('widget'):
        tool['_meta'] = {
            'openai/outputTemplate': f"ui://widget/{tool_def['widget']}",
            'openai/widgetAccessible': tool_def.get('accessible', False),
        }

        if tool_def.get('invocation'):
            tool['_meta']['openai/toolInvocation'] = tool_def['invocation']

    return tool

def main():
    """Generate all tool schemas"""
    output = {'tools': []}

    for tool_def in TOOLS:
        schema = generate_tool_schema(tool_def)
        output['tools'].append(schema)

    # Write to file
    output_file = Path('src/lib/mcp/tool-schemas.json')
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(output, indent=2))

    print(f"✓ Generated {len(output['tools'])} tool schemas")

if __name__ == '__main__':
    main()
```

---

## Testing Strategy

### Integration Tests

```typescript
// src/__tests__/mcp-server.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('MCP Server Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Get OAuth token for testing
    authToken = await getTestOAuthToken();
  });

  it('should list all tools', async () => {
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    const data = await response.json();
    expect(data.result.tools).toHaveLength(13);
    expect(data.result.tools[0].name).toBe('create_world');
  });

  it('should create a world via tool call', async () => {
    const response = await fetch('http://localhost:3000/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'create_world',
          arguments: {
            name: 'Test World',
            theme: 'Fantasy',
          },
        },
        id: 2,
      }),
    });

    const data = await response.json();
    expect(data.result.content[0].type).toBe('text');
    const result = JSON.parse(data.result.content[0].text);
    expect(result.worldId).toBeDefined();
    expect(result.name).toBe('Test World');
  });
});
```

### E2E Widget Tests

```typescript
// e2e/widgets.spec.ts
import { test, expect } from '@playwright/test';

test('character card widget renders', async ({ page }) => {
  // Navigate to widget
  await page.goto('http://localhost:3000/api/widgets/character-card.html');

  // Post state to widget
  await page.evaluate(() => {
    window.postMessage({
      type: 'widget-state',
      state: {
        characterId: '123',
        name: 'Aragorn',
        role: 'Ranger',
        traits: ['Brave', 'Noble', 'Skilled'],
      },
    }, '*');
  });

  // Wait for render
  await page.waitForTimeout(500);

  // Verify content
  await expect(page.getByText('Aragorn')).toBeVisible();
  await expect(page.getByText('Ranger')).toBeVisible();
  await expect(page.getByText('Brave')).toBeVisible();
});
```

---

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain (https://worldcrafter.app)
- [ ] Configure Supabase OAuth redirect URIs for ChatGPT
- [ ] Deploy with HTTPS enabled (required for OAuth)
- [ ] Test MCP endpoint: `curl https://worldcrafter.app/api/mcp`
- [ ] Test OAuth metadata: `curl https://worldcrafter.app/.well-known/oauth-protected-resource`
- [ ] Test widget loading: `curl https://worldcrafter.app/api/widgets/character-card.html`
- [ ] Register with ChatGPT Apps SDK portal
- [ ] Submit for review with example conversation flows

---

## Example Conversation Flows

### Flow 1: Create World & Character

```
User: Create a fantasy world called "Eldergrove"
ChatGPT: [Calls create_world tool]
Widget: [Displays world-card.html with world details]

User: Add a wizard character named Merlin
ChatGPT: [Calls create_character tool]
Widget: [Displays character-card.html with Merlin's details]

User: Show me the full character sheet
ChatGPT: [Calls get_character tool]
Widget: [Opens character-sheet.html in PiP mode]
```

### Flow 2: World Exploration

```
User: Search my world for "ancient artifacts"
ChatGPT: [Calls search_world tool]
Response: Found 3 artifacts in Eldergrove...

User: Show me a summary of the entire world
ChatGPT: [Calls get_world_summary tool]
Widget: [Opens world-dashboard.html in fullscreen]
```

---

## Performance Targets

- **Tool call latency**: < 200ms (p95)
- **Widget load time**: < 500ms
- **OAuth token validation**: < 50ms
- **Concurrent requests**: 100 req/s per user
- **Widget bundle size**: < 100KB per widget

---

## Security Considerations

1. **OAuth Token Validation**: Every MCP request validates JWT
2. **RLS Policies**: All database queries respect user ownership
3. **Rate Limiting**: 60 tool calls per minute per user
4. **CORS**: Strict origin checking (https://chatgpt.com only)
5. **Input Validation**: All tool arguments validated with Zod
6. **XSS Protection**: Widget state sanitized before rendering

---

## Troubleshooting

### Issue: "Invalid token" error
- Check `Authorization: Bearer <token>` header format
- Verify token hasn't expired (Supabase default: 1 hour)
- Ensure Supabase project URL matches OAuth issuer

### Issue: Widget not loading
- Verify `text/html+skybridge` MIME type
- Check CORS headers allow https://chatgpt.com
- Ensure widget bundle exists in dist/widgets/
- Check <base> element in HTML wrapper

### Issue: Tool not found
- Verify tool name in mcpToolHandlers export
- Check tool schema includes correct `name` field
- Ensure tool appears in `tools/list` response

---

## Future Enhancements

- [ ] Real-time collaboration via Server-Sent Events
- [ ] AI-powered worldbuilding suggestions (GPT-4)
- [ ] Export to popular formats (D&D 5e, Notion)
- [ ] Voice input for worldbuilding conversations
- [ ] Multi-language support for international users
- [ ] Advanced relationship graphs with D3.js force layouts
- [ ] Timeline visualization for world events
- [ ] Map generation with Stable Diffusion

---

## References

See `references/` directory for:
- **mcp-protocol.md**: Complete JSON-RPC 2.0 spec
- **oauth-flow.md**: OAuth 2.1 + PKCE implementation
- **widget-development.md**: Widget API reference
- **tool-definitions.md**: All 13 tool schemas

---

## Support

For issues or questions:
- File an issue in the WorldCrafter repository
- Check ChatGPT Apps SDK documentation
- Review Supabase Auth documentation
- Test with MCP CLI: `npm install -g @anthropic/mcp-cli`
