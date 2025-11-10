# WorldCrafter ChatGPT Setup Skill

Complete ChatGPT Apps SDK integration skill for conversational worldbuilding.

## Overview

This skill enables Claude to set up full ChatGPT Apps SDK integration for WorldCrafter, including:

- **Model Context Protocol (MCP)**: JSON-RPC 2.0 server with 13 worldbuilding tools
- **OAuth 2.1 Authorization**: PKCE-secured token flow via Supabase Auth
- **Conversational Widgets**: 6 interactive React components for rich UI

## Quick Start

To use this skill, say:
- "Set up ChatGPT integration"
- "Create MCP server"
- "Enable conversational worldbuilding"

## Directory Structure

```
worldcrafter-chatgpt-setup/
├── SKILL.md                          # Main skill instructions (41 KB)
├── README.md                         # This file
│
├── scripts/                          # Code generation scripts
│   ├── generate_tool_schemas.py      # Zod → JSON Schema converter (15 KB)
│   ├── generate_mcp_server.py        # MCP route generator (10 KB)
│   └── bundle_widgets.sh             # Widget bundler (5 KB)
│
├── assets/templates/                 # Production-ready templates
│   ├── mcp-server-route.ts           # MCP server implementation (6 KB)
│   ├── oauth-metadata-route.ts       # OAuth metadata endpoint (3 KB)
│   ├── widget-character-card.tsx     # Character card widget (11 KB)
│   ├── widget-world-dashboard.tsx    # World dashboard widget (13 KB)
│   └── widget-relationship-graph.tsx # Relationship graph widget (12 KB)
│
└── references/                       # Complete documentation
    ├── mcp-protocol.md               # JSON-RPC 2.0 spec & examples (13 KB)
    ├── oauth-flow.md                 # OAuth 2.1 + PKCE guide (19 KB)
    ├── widget-development.md         # React widget dev guide (19 KB)
    └── tool-definitions.md           # All 13 tool schemas (23 KB)
```

## Implementation Checklist

### Phase 1: MCP Server (30 min)
- [ ] Generate tool schemas: `python scripts/generate_tool_schemas.py`
- [ ] Generate MCP route: `python scripts/generate_mcp_server.py`
- [ ] Copy `assets/templates/mcp-server-route.ts` to `src/app/api/mcp/route.ts`
- [ ] Create OAuth validation: `src/lib/auth/oauth.ts`

### Phase 2: OAuth Setup (45 min)
- [ ] Copy `assets/templates/oauth-metadata-route.ts` to `src/app/.well-known/oauth-protected-resource/route.ts`
- [ ] Configure Supabase OAuth settings
- [ ] Test metadata endpoint: `curl https://worldcrafter.app/.well-known/oauth-protected-resource`

### Phase 3: Tool Handlers (90 min)
- [ ] Implement 13 tool handlers in `src/lib/mcp/tools/`
- [ ] Add RLS policies for new tables
- [ ] Test each tool with `curl` or MCP CLI

### Phase 4: Widgets (120 min)
- [ ] Copy widget templates to `src/widgets/`
- [ ] Create `vite.config.widgets.ts`
- [ ] Bundle widgets: `./scripts/bundle_widgets.sh`
- [ ] Create widget route: `src/app/api/widgets/[name]/route.ts`
- [ ] Test widgets in browser

### Phase 5: Testing (60 min)
- [ ] Integration tests for MCP endpoints
- [ ] E2E tests for OAuth flow
- [ ] Widget rendering tests
- [ ] Performance testing (< 200ms tool calls)

### Phase 6: Deployment (60 min)
- [ ] Set `NEXT_PUBLIC_BASE_URL` in production
- [ ] Deploy to production with HTTPS
- [ ] Register with ChatGPT Apps SDK portal
- [ ] Test full flow end-to-end

**Total Estimated Time**: 6-7 hours

## Key Features

### 13 MCP Tools

**World Management:**
1. `create_world` - Create new world
2. `get_world` - Retrieve world details
3. `update_world` - Modify world properties

**Character Management:**
4. `create_character` - Add character
5. `get_character` - Retrieve character
6. `update_character` - Modify character

**Location Management:**
7. `create_location` - Add location
8. `get_location` - Retrieve location

**Relationships:**
9. `add_relationship` - Link characters

**Discovery & AI:**
10. `search_world` - Semantic search
11. `get_world_summary` - AI summary
12. `export_world` - Export data
13. `suggest_ideas` - AI suggestions

### 6 Conversational Widgets

**Inline Cards:**
- `character-card.html` - Character overview
- `world-card.html` - World overview
- `location-card.html` - Location overview

**Picture-in-Picture:**
- `character-sheet.html` - Full character details
- `relationship-graph.html` - D3.js force graph

**Fullscreen:**
- `world-dashboard.html` - Analytics & timeline

### Security Features

- OAuth 2.1 with PKCE (S256)
- JWT token validation
- Row-Level Security (RLS)
- HTTPS required
- CORS restricted to https://chatgpt.com
- Rate limiting (60 req/min)

## Technology Stack

- **Protocol**: JSON-RPC 2.0, OAuth 2.1
- **Server**: Next.js 16 API Routes
- **Auth**: Supabase Auth
- **Database**: PostgreSQL + Prisma
- **Widgets**: React 19 + Vite
- **Testing**: Vitest + Playwright

## Documentation

### References
- `references/mcp-protocol.md` - Complete MCP specification
- `references/oauth-flow.md` - OAuth 2.1 implementation guide
- `references/widget-development.md` - Widget development guide
- `references/tool-definitions.md` - All 13 tool schemas with examples

### Scripts
- `scripts/generate_tool_schemas.py` - Convert Zod to JSON Schema
- `scripts/generate_mcp_server.py` - Generate MCP route from schemas
- `scripts/bundle_widgets.sh` - Bundle React widgets with Vite

### Templates
- `assets/templates/mcp-server-route.ts` - Production MCP server
- `assets/templates/oauth-metadata-route.ts` - OAuth metadata endpoint
- `assets/templates/widget-*.tsx` - React widget components

## Example Conversation Flow

```
User: Create a fantasy world called "Eldergrove"
ChatGPT: [Calls create_world tool]
Widget: [Displays world-card.html]

User: Add a wizard character named Merlin
ChatGPT: [Calls create_character tool]
Widget: [Displays character-card.html]

User: Show me the character sheet
ChatGPT: [Calls get_character tool]
Widget: [Opens character-sheet.html in PiP]

User: Add a relationship between Merlin and Arthur
ChatGPT: [Calls add_relationship tool]
Response: "Relationship added!"

User: Show me all relationships
ChatGPT: [Opens relationship-graph.html]
Widget: [D3.js force graph of character relationships]
```

## Performance Targets

- **Tool call latency**: < 200ms (p95)
- **Widget load time**: < 500ms
- **Widget bundle size**: < 100KB per widget
- **OAuth validation**: < 50ms
- **Concurrent requests**: 100 req/s per user

## Testing

### Manual Testing

```bash
# Test OAuth metadata
curl https://worldcrafter.app/.well-known/oauth-protected-resource

# Test MCP tools/list
curl -X POST https://worldcrafter.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Test widget loading
curl https://worldcrafter.app/api/widgets/character-card.html
```

### Automated Testing

```bash
# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:all
```

## Troubleshooting

### MCP Server Issues
- Check OAuth token is valid
- Verify CORS headers allow https://chatgpt.com
- Ensure tool schemas match handler signatures

### Widget Issues
- Verify `text/html+skybridge` MIME type
- Check widget bundle exists in `dist/widgets/`
- Test widget standalone in browser first

### OAuth Issues
- Confirm Supabase project URL is correct
- Verify PKCE code challenge matches verifier
- Check redirect URI matches registered URI

## Support

For questions or issues:
1. Check `SKILL.md` for detailed instructions
2. Review relevant reference docs in `references/`
3. Test with example templates in `assets/templates/`
4. Consult WorldCrafter CLAUDE.md for project patterns

## License

Part of WorldCrafter project. See main project license.

## Version

**Version**: 1.0.0
**Last Updated**: 2025-11-09
**Status**: Production Ready
