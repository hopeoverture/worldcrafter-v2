# MCP Tool Definitions Reference

Complete reference for all 13 WorldCrafter MCP tools with schemas, examples, and implementation guides.

## Tool Categories

1. **World Management** (3 tools): Create, read, update worlds
2. **Character Management** (3 tools): Create, read, update characters
3. **Location Management** (2 tools): Create, read locations
4. **Relationships** (1 tool): Link characters
5. **Discovery & AI** (4 tools): Search, summarize, export, suggest

---

## 1. World Management

### create_world

Create a new fictional world with customizable properties.

**Tool Schema:**
```json
{
  "name": "create_world",
  "title": "Create World",
  "description": "Create a new fictional world with customizable properties (theme, description, etc.)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "World name"
      },
      "theme": {
        "type": "string",
        "maxLength": 50,
        "description": "Genre/theme (fantasy, sci-fi, modern, historical, etc.)"
      },
      "description": {
        "type": "string",
        "maxLength": 1000,
        "description": "World description"
      }
    },
    "required": ["name"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/world-card.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Creating your world...",
      "invoked": "World created successfully!"
    }
  }
}
```

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_world",
    "arguments": {
      "name": "Eldergrove",
      "theme": "Dark Fantasy",
      "description": "A mystical forest realm shrouded in ancient magic"
    }
  },
  "id": 1
}
```

**Example Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"worldId\":\"abc123\",\"name\":\"Eldergrove\",\"theme\":\"Dark Fantasy\",\"description\":\"A mystical forest realm shrouded in ancient magic\",\"createdAt\":\"2025-11-09T10:30:00Z\"}"
      }
    ]
  },
  "id": 1
}
```

**Implementation:**
```typescript
// src/lib/mcp/tools/world-tools.ts
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateWorldSchema = z.object({
  name: z.string().min(1).max(100),
  theme: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
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

---

### get_world

Retrieve detailed information about a world.

**Tool Schema:**
```json
{
  "name": "get_world",
  "title": "Get World",
  "description": "Retrieve detailed information about a world including characters, locations, and relationships",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      }
    },
    "required": ["worldId"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/world-dashboard.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Loading world details...",
      "invoked": "Here's your world!"
    }
  }
}
```

**Example Response:**
```json
{
  "worldId": "abc123",
  "name": "Eldergrove",
  "theme": "Dark Fantasy",
  "description": "A mystical forest realm",
  "characterCount": 12,
  "locationCount": 8,
  "relationshipCount": 15,
  "createdAt": "2025-11-09T10:30:00Z",
  "updatedAt": "2025-11-09T15:45:00Z",
  "recentActivity": [
    {
      "id": "act1",
      "type": "character_added",
      "description": "Added character: Merlin the Wise",
      "timestamp": "2025-11-09T15:45:00Z"
    }
  ]
}
```

---

### update_world

Modify world properties.

**Tool Schema:**
```json
{
  "name": "update_world",
  "title": "Update World",
  "description": "Modify world properties such as name, theme, or description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "New world name"
      },
      "theme": {
        "type": "string",
        "maxLength": 50,
        "description": "New theme"
      },
      "description": {
        "type": "string",
        "maxLength": 1000,
        "description": "New description"
      }
    },
    "required": ["worldId"]
  },
  "_meta": {
    "openai/toolInvocation": {
      "invoking": "Updating world...",
      "invoked": "World updated!"
    }
  }
}
```

---

## 2. Character Management

### create_character

Add a new character to the world.

**Tool Schema:**
```json
{
  "name": "create_character",
  "title": "Create Character",
  "description": "Add a new character to the world with name, role, traits, and background story",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "Character name"
      },
      "role": {
        "type": "string",
        "maxLength": 50,
        "description": "Character role/occupation (warrior, mage, merchant, etc.)"
      },
      "traits": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 10,
        "description": "Character traits (brave, cunning, wise, etc.)"
      },
      "background": {
        "type": "string",
        "maxLength": 2000,
        "description": "Background story"
      },
      "avatarUrl": {
        "type": "string",
        "format": "uri",
        "description": "Avatar image URL"
      }
    },
    "required": ["worldId", "name"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/character-card.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Bringing your character to life...",
      "invoked": "Character created!"
    }
  }
}
```

**Example Request:**
```json
{
  "name": "create_character",
  "arguments": {
    "worldId": "abc123",
    "name": "Merlin the Wise",
    "role": "Archmage",
    "traits": ["Wise", "Mysterious", "Powerful"],
    "background": "An ancient wizard who guards the secrets of Eldergrove"
  }
}
```

**Example Response:**
```json
{
  "characterId": "char456",
  "name": "Merlin the Wise",
  "role": "Archmage",
  "traits": ["Wise", "Mysterious", "Powerful"],
  "background": "An ancient wizard who guards the secrets of Eldergrove",
  "worldName": "Eldergrove",
  "createdAt": "2025-11-09T15:45:00Z"
}
```

**Implementation:**
```typescript
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
      avatarUrl: validated.avatarUrl,
    },
  });

  return {
    characterId: character.id,
    name: character.name,
    role: character.role,
    traits: character.traits,
    background: character.background,
    worldName: world.name,
    createdAt: character.createdAt.toISOString(),
  };
}
```

---

### get_character

Retrieve detailed character information.

**Tool Schema:**
```json
{
  "name": "get_character",
  "title": "Get Character",
  "description": "Retrieve detailed character information including traits, relationships, and background",
  "inputSchema": {
    "type": "object",
    "properties": {
      "characterId": {
        "type": "string",
        "description": "Character ID"
      }
    },
    "required": ["characterId"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/character-sheet.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Loading character details...",
      "invoked": "Here's your character!"
    }
  }
}
```

**Example Response:**
```json
{
  "characterId": "char456",
  "name": "Merlin the Wise",
  "role": "Archmage",
  "traits": ["Wise", "Mysterious", "Powerful"],
  "background": "An ancient wizard...",
  "worldName": "Eldergrove",
  "relationships": [
    {
      "characterId": "char789",
      "characterName": "Arthur",
      "type": "mentor",
      "description": "Mentor to King Arthur"
    }
  ],
  "createdAt": "2025-11-09T15:45:00Z",
  "updatedAt": "2025-11-09T16:00:00Z"
}
```

---

### update_character

Modify character properties.

**Tool Schema:**
```json
{
  "name": "update_character",
  "title": "Update Character",
  "description": "Modify character properties like name, role, traits, or background",
  "inputSchema": {
    "type": "object",
    "properties": {
      "characterId": { "type": "string" },
      "name": { "type": "string", "minLength": 1, "maxLength": 100 },
      "role": { "type": "string", "maxLength": 50 },
      "traits": { "type": "array", "items": { "type": "string" } },
      "background": { "type": "string", "maxLength": 2000 },
      "avatarUrl": { "type": "string", "format": "uri" }
    },
    "required": ["characterId"]
  }
}
```

---

## 3. Location Management

### create_location

Add a location to the world.

**Tool Schema:**
```json
{
  "name": "create_location",
  "title": "Create Location",
  "description": "Add a location to the world (city, dungeon, forest, etc.) with description and type",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "name": {
        "type": "string",
        "minLength": 1,
        "maxLength": 100,
        "description": "Location name"
      },
      "type": {
        "type": "string",
        "enum": ["city", "dungeon", "forest", "mountain", "ocean", "plains", "village", "castle", "temple", "ruins"],
        "description": "Location type"
      },
      "description": {
        "type": "string",
        "maxLength": 2000,
        "description": "Location description"
      }
    },
    "required": ["worldId", "name"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/location-card.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Creating location...",
      "invoked": "Location added to your world!"
    }
  }
}
```

**Example Request:**
```json
{
  "name": "create_location",
  "arguments": {
    "worldId": "abc123",
    "name": "Tower of Shadows",
    "type": "dungeon",
    "description": "A dark tower at the heart of Eldergrove, rumored to hold ancient artifacts"
  }
}
```

---

### get_location

Retrieve location details.

**Tool Schema:**
```json
{
  "name": "get_location",
  "title": "Get Location",
  "description": "Retrieve location details including description, type, and associated characters",
  "inputSchema": {
    "type": "object",
    "properties": {
      "locationId": {
        "type": "string",
        "description": "Location ID"
      }
    },
    "required": ["locationId"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/location-card.html",
    "openai/widgetAccessible": true
  }
}
```

---

## 4. Relationships

### add_relationship

Create a relationship between two characters.

**Tool Schema:**
```json
{
  "name": "add_relationship",
  "title": "Add Relationship",
  "description": "Create a relationship between two characters (ally, enemy, family, mentor, etc.)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "characterId1": {
        "type": "string",
        "description": "First character ID"
      },
      "characterId2": {
        "type": "string",
        "description": "Second character ID"
      },
      "type": {
        "type": "string",
        "enum": ["ally", "enemy", "family", "mentor", "romantic", "neutral"],
        "description": "Relationship type"
      },
      "description": {
        "type": "string",
        "maxLength": 500,
        "description": "Relationship description"
      }
    },
    "required": ["characterId1", "characterId2", "type"]
  },
  "_meta": {
    "openai/toolInvocation": {
      "invoking": "Creating relationship...",
      "invoked": "Relationship added!"
    }
  }
}
```

**Example Request:**
```json
{
  "name": "add_relationship",
  "arguments": {
    "characterId1": "char456",
    "characterId2": "char789",
    "type": "mentor",
    "description": "Merlin serves as Arthur's wise mentor and advisor"
  }
}
```

**Example Response:**
```json
{
  "relationshipId": "rel321",
  "character1Name": "Merlin the Wise",
  "character2Name": "King Arthur",
  "type": "mentor",
  "description": "Merlin serves as Arthur's wise mentor and advisor",
  "createdAt": "2025-11-09T16:00:00Z"
}
```

---

## 5. Discovery & AI

### search_world

Perform semantic search across world content.

**Tool Schema:**
```json
{
  "name": "search_world",
  "title": "Search World",
  "description": "Perform semantic search across all world content (characters, locations, events)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "query": {
        "type": "string",
        "minLength": 1,
        "description": "Search query"
      },
      "limit": {
        "type": "number",
        "minimum": 1,
        "maximum": 50,
        "default": 10,
        "description": "Maximum results"
      }
    },
    "required": ["worldId", "query"]
  }
}
```

**Example Request:**
```json
{
  "name": "search_world",
  "arguments": {
    "worldId": "abc123",
    "query": "ancient magic artifacts",
    "limit": 5
  }
}
```

**Example Response:**
```json
{
  "results": [
    {
      "type": "location",
      "id": "loc123",
      "name": "Tower of Shadows",
      "relevance": 0.95,
      "snippet": "...rumored to hold ancient artifacts..."
    },
    {
      "type": "character",
      "id": "char456",
      "name": "Merlin the Wise",
      "relevance": 0.87,
      "snippet": "...guards the secrets of ancient magic..."
    }
  ],
  "totalResults": 5
}
```

---

### get_world_summary

Generate AI-powered summary of the world.

**Tool Schema:**
```json
{
  "name": "get_world_summary",
  "title": "Get World Summary",
  "description": "Generate an AI-powered summary of the entire world including key characters, locations, and themes",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      }
    },
    "required": ["worldId"]
  },
  "_meta": {
    "openai/outputTemplate": "ui://widget/world-dashboard.html",
    "openai/widgetAccessible": true,
    "openai/toolInvocation": {
      "invoking": "Generating world summary...",
      "invoked": "Summary ready!"
    }
  }
}
```

**Example Response:**
```json
{
  "worldId": "abc123",
  "summary": "Eldergrove is a dark fantasy realm shrouded in ancient magic. The world centers around the Tower of Shadows, a mysterious dungeon at its heart. Key characters include Merlin the Wise, an ancient archmage who guards the realm's secrets, and King Arthur, his protégé destined to unite the scattered kingdoms.",
  "keyThemes": ["Ancient Magic", "Heroic Destiny", "Dark Secrets"],
  "keyCharacters": [
    { "id": "char456", "name": "Merlin the Wise", "role": "Archmage" },
    { "id": "char789", "name": "King Arthur", "role": "King" }
  ],
  "keyLocations": [
    { "id": "loc123", "name": "Tower of Shadows", "type": "dungeon" }
  ],
  "generatedAt": "2025-11-09T16:15:00Z"
}
```

**Implementation:**
```typescript
export async function getWorldSummary(args: any, userId: string) {
  const { worldId } = args;

  // Fetch world with all content
  const world = await prisma.world.findFirst({
    where: { id: worldId, userId },
    include: {
      characters: true,
      locations: true,
      relationships: true,
    },
  });

  if (!world) {
    throw new Error('World not found');
  }

  // Generate AI summary (using OpenAI, Claude, etc.)
  const summary = await generateAISummary(world);

  return {
    worldId: world.id,
    summary,
    keyThemes: extractThemes(world),
    keyCharacters: world.characters.slice(0, 5).map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
    })),
    keyLocations: world.locations.slice(0, 5).map((l) => ({
      id: l.id,
      name: l.name,
      type: l.type,
    })),
    generatedAt: new Date().toISOString(),
  };
}
```

---

### export_world

Generate export bundle (JSON/Markdown).

**Tool Schema:**
```json
{
  "name": "export_world",
  "title": "Export World",
  "description": "Export world data as JSON or Markdown for backup or sharing",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "format": {
        "type": "string",
        "enum": ["json", "markdown"],
        "default": "json",
        "description": "Export format"
      }
    },
    "required": ["worldId"]
  },
  "_meta": {
    "openai/toolInvocation": {
      "invoking": "Exporting world...",
      "invoked": "Export complete!"
    }
  }
}
```

**Example Response (JSON):**
```json
{
  "format": "json",
  "downloadUrl": "https://worldcrafter.app/exports/abc123.json",
  "expiresAt": "2025-11-10T16:20:00Z",
  "fileSize": 45678,
  "content": {
    "world": {
      "id": "abc123",
      "name": "Eldergrove",
      "theme": "Dark Fantasy",
      "description": "..."
    },
    "characters": [...],
    "locations": [...],
    "relationships": [...]
  }
}
```

**Example Response (Markdown):**
```markdown
# Eldergrove

**Theme**: Dark Fantasy

**Description**: A mystical forest realm shrouded in ancient magic

## Characters

### Merlin the Wise
- **Role**: Archmage
- **Traits**: Wise, Mysterious, Powerful
- **Background**: An ancient wizard who guards the secrets of Eldergrove

## Locations

### Tower of Shadows
- **Type**: Dungeon
- **Description**: A dark tower at the heart of Eldergrove...

## Relationships

- **Merlin the Wise** → **King Arthur** (mentor)
```

---

### suggest_ideas

Get AI-powered worldbuilding suggestions.

**Tool Schema:**
```json
{
  "name": "suggest_ideas",
  "title": "Suggest Ideas",
  "description": "Get AI-powered suggestions for characters, locations, events, or items",
  "inputSchema": {
    "type": "object",
    "properties": {
      "worldId": {
        "type": "string",
        "description": "World ID"
      },
      "category": {
        "type": "string",
        "enum": ["characters", "locations", "events", "items"],
        "description": "Suggestion category"
      },
      "count": {
        "type": "number",
        "minimum": 1,
        "maximum": 10,
        "default": 3,
        "description": "Number of suggestions"
      }
    },
    "required": ["worldId", "category"]
  },
  "_meta": {
    "openai/toolInvocation": {
      "invoking": "Generating ideas...",
      "invoked": "Here are some suggestions!"
    }
  }
}
```

**Example Request:**
```json
{
  "name": "suggest_ideas",
  "arguments": {
    "worldId": "abc123",
    "category": "characters",
    "count": 3
  }
}
```

**Example Response:**
```json
{
  "category": "characters",
  "suggestions": [
    {
      "name": "Morgana the Shadow Weaver",
      "role": "Dark Sorceress",
      "traits": ["Cunning", "Ambitious", "Mysterious"],
      "background": "A rival to Merlin who seeks forbidden knowledge",
      "rationale": "Provides conflict with existing archmage character"
    },
    {
      "name": "Sir Galahad",
      "role": "Knight",
      "traits": ["Noble", "Pure", "Brave"],
      "background": "A knight on a quest for a legendary artifact",
      "rationale": "Complements Arthur's leadership with loyal follower"
    },
    {
      "name": "The Green Lady",
      "role": "Forest Spirit",
      "traits": ["Ancient", "Wise", "Protective"],
      "background": "Guardian spirit of Eldergrove's ancient trees",
      "rationale": "Adds mystical element aligned with dark fantasy theme"
    }
  ],
  "generatedAt": "2025-11-09T16:30:00Z"
}
```

---

## Common Patterns

### Error Handling

All tools should return consistent error responses:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Tool execution failed: World not found",
    "data": {
      "toolName": "get_world",
      "errorType": "NotFoundError",
      "worldId": "invalid123"
    }
  },
  "id": 1
}
```

### Pagination

For tools returning lists, support pagination:

```json
{
  "inputSchema": {
    "properties": {
      "offset": { "type": "number", "default": 0 },
      "limit": { "type": "number", "default": 10, "maximum": 100 }
    }
  }
}
```

### Filtering

Support common filters:

```json
{
  "inputSchema": {
    "properties": {
      "filter": {
        "type": "object",
        "properties": {
          "role": { "type": "string" },
          "traits": { "type": "array", "items": { "type": "string" } }
        }
      }
    }
  }
}
```

### Sorting

Support sorting:

```json
{
  "inputSchema": {
    "properties": {
      "sortBy": { "type": "string", "enum": ["name", "createdAt", "updatedAt"] },
      "sortOrder": { "type": "string", "enum": ["asc", "desc"], "default": "asc" }
    }
  }
}
```

## Additional Resources

- [JSON Schema Specification](https://json-schema.org/)
- [Zod Documentation](https://zod.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
