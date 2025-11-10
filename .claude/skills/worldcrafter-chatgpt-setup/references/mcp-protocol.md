# Model Context Protocol (MCP) Reference

Complete reference for implementing the Model Context Protocol for ChatGPT Apps SDK integration.

## Overview

The Model Context Protocol (MCP) is a JSON-RPC 2.0-based protocol that enables AI assistants like ChatGPT to interact with external tools and services. MCP provides a standardized way to expose capabilities as "tools" that can be discovered and invoked by the AI.

**Key Features:**
- JSON-RPC 2.0 over HTTPS
- OAuth 2.1 authentication
- Tool discovery and invocation
- Streaming support via Server-Sent Events
- Widget integration for rich UI

## Protocol Specification

### Transport

MCP uses HTTPS as the transport layer:
- **Endpoint**: `/api/mcp`
- **Methods**: `POST` (requests), `GET` (streaming), `OPTIONS` (CORS)
- **Content-Type**: `application/json`
- **Authentication**: `Authorization: Bearer <token>`

### JSON-RPC 2.0 Format

All MCP requests and responses follow JSON-RPC 2.0 specification.

#### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_world",
    "arguments": {
      "name": "Eldergrove",
      "theme": "Fantasy"
    }
  },
  "id": 1
}
```

**Fields:**
- `jsonrpc`: Always `"2.0"`
- `method`: MCP method name (e.g., `"tools/list"`, `"tools/call"`)
- `params`: Method-specific parameters (optional)
- `id`: Request identifier (string, number, or null)

#### Success Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"worldId\": \"123\", \"name\": \"Eldergrove\"}"
      }
    ]
  },
  "id": 1
}
```

**Fields:**
- `jsonrpc`: Always `"2.0"`
- `result`: Method result (structure varies by method)
- `id`: Same as request ID

#### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found",
    "data": { "method": "invalid/method" }
  },
  "id": 1
}
```

**Standard Error Codes:**
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32001`: Unauthorized (custom)

## MCP Methods

### 1. tools/list

Returns all available tools with their schemas.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "create_world",
        "title": "Create World",
        "description": "Create a new fictional world",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "World name"
            },
            "theme": {
              "type": "string",
              "description": "Genre/theme"
            }
          },
          "required": ["name"]
        },
        "_meta": {
          "openai/outputTemplate": "ui://widget/world-card.html",
          "openai/widgetAccessible": true,
          "openai/toolInvocation": {
            "invoking": "Creating your world...",
            "invoked": "World created!"
          }
        }
      }
    ]
  },
  "id": 1
}
```

**Tool Schema Structure:**
- `name`: Unique tool identifier
- `title`: Human-readable title
- `description`: What the tool does
- `inputSchema`: JSON Schema for tool arguments
- `_meta`: OpenAI-specific metadata (optional)

### 2. tools/call

Executes a tool with provided arguments.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_world",
    "arguments": {
      "name": "Eldergrove",
      "theme": "Fantasy",
      "description": "A mystical forest realm"
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"worldId\":\"abc123\",\"name\":\"Eldergrove\",\"theme\":\"Fantasy\"}"
      }
    ]
  },
  "id": 2
}
```

**Content Types:**
- `text`: Plain text or JSON string
- `image`: Base64-encoded image data
- `resource`: Reference to external resource

### 3. resources/list (Optional)

Lists available resources (data sources).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "resources/list",
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "resources": [
      {
        "uri": "worlds://list",
        "name": "User Worlds",
        "description": "List of all worlds",
        "mimeType": "application/json"
      }
    ]
  },
  "id": 3
}
```

### 4. prompts/list (Optional)

Lists conversation starters.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "prompts/list",
  "id": 4
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "prompts": [
      {
        "name": "start-fantasy-world",
        "description": "Start creating a fantasy world",
        "arguments": [
          {
            "name": "theme",
            "description": "Fantasy subgenre",
            "required": false
          }
        ]
      }
    ]
  },
  "id": 4
}
```

## OpenAI Metadata Extensions

### outputTemplate

Specifies a widget to display tool results.

```json
"_meta": {
  "openai/outputTemplate": "ui://widget/character-card.html"
}
```

**Widget URI Format:**
- `ui://widget/<name>.html`: Inline card
- `ui://widget/<name>.html?mode=pip`: Picture-in-picture
- `ui://widget/<name>.html?mode=fullscreen`: Fullscreen

### widgetAccessible

Indicates if the widget can call tools.

```json
"_meta": {
  "openai/widgetAccessible": true
}
```

### toolInvocation

Custom messages during tool execution.

```json
"_meta": {
  "openai/toolInvocation": {
    "invoking": "Creating your world...",
    "invoked": "World created successfully!"
  }
}
```

## Server-Sent Events (Streaming)

For long-running operations, MCP supports streaming via SSE.

**Request:**
```http
GET /api/mcp HTTP/1.1
Authorization: Bearer <token>
Accept: text/event-stream
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: connected
data: {"status":"ready"}

event: tool-progress
data: {"toolName":"export_world","progress":50}

event: tool-complete
data: {"toolName":"export_world","result":{...}}

event: ping
data: {}
```

**Event Types:**
- `connected`: Initial connection established
- `tool-progress`: Progress update (0-100)
- `tool-complete`: Tool finished
- `tool-error`: Tool failed
- `ping`: Keep-alive (every 30s)

## Authentication

Every MCP request must include a valid OAuth 2.1 bearer token.

**Header:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validation:**
1. Extract token from `Authorization` header
2. Verify JWT signature with Supabase
3. Check expiration (default 1 hour)
4. Extract user ID from token claims
5. Validate scopes match required permissions

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32001,
    "message": "Unauthorized: Invalid or expired token"
  },
  "id": null
}
```

## CORS Configuration

MCP endpoints must allow cross-origin requests from ChatGPT.

**Required Headers:**
```http
Access-Control-Allow-Origin: https://chatgpt.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

**Preflight Request (OPTIONS):**
```http
OPTIONS /api/mcp HTTP/1.1
Origin: https://chatgpt.com
```

**Preflight Response:**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://chatgpt.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Rate Limiting

Recommended rate limits for MCP endpoints:

- **tools/list**: 10 requests/minute per user
- **tools/call**: 60 requests/minute per user
- **Streaming**: 5 concurrent connections per user

**Rate Limit Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Rate limit exceeded",
    "data": {
      "retryAfter": 30
    }
  },
  "id": 1
}
```

## Error Handling

### Client-Side Errors

**Parse Error (-32700):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "Parse error: Invalid JSON"
  },
  "id": null
}
```

**Invalid Request (-32600):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request: Missing 'method' field"
  },
  "id": null
}
```

**Method Not Found (-32601):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found: invalid/method"
  },
  "id": 1
}
```

**Invalid Params (-32602):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": [
      {
        "path": ["name"],
        "message": "Required"
      }
    ]
  },
  "id": 2
}
```

### Server-Side Errors

**Internal Error (-32603):**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error: Database connection failed"
  },
  "id": 3
}
```

**Tool Execution Error:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Tool execution failed: World not found",
    "data": {
      "toolName": "get_world",
      "errorType": "NotFoundError"
    }
  },
  "id": 4
}
```

## Testing MCP Server

### Using cURL

**List Tools:**
```bash
curl -X POST https://worldcrafter.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**Call Tool:**
```bash
curl -X POST https://worldcrafter.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_world",
      "arguments": {"name": "Test World"}
    },
    "id": 2
  }'
```

**Test Streaming:**
```bash
curl -N https://worldcrafter.app/api/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: text/event-stream"
```

### Using MCP CLI

```bash
# Install MCP CLI
npm install -g @anthropic/mcp-cli

# List tools
mcp-cli tools list \
  --endpoint https://worldcrafter.app/api/mcp \
  --token $TOKEN

# Call tool
mcp-cli tools call create_world \
  --endpoint https://worldcrafter.app/api/mcp \
  --token $TOKEN \
  --args '{"name": "Test World"}'
```

## Performance Optimization

### Caching Tool Schemas

Cache `tools/list` response for 5 minutes:

```typescript
const TOOL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let toolSchemaCache: { data: any; timestamp: number } | null = null;

async function listTools() {
  const now = Date.now();
  if (toolSchemaCache && now - toolSchemaCache.timestamp < TOOL_CACHE_TTL) {
    return toolSchemaCache.data;
  }

  const data = await loadToolSchemas();
  toolSchemaCache = { data, timestamp: now };
  return data;
}
```

### Connection Pooling

Use database connection pooling for tool handlers:

```typescript
// Use PgBouncer connection string
const DATABASE_URL = process.env.DATABASE_URL; // Port 6543

// Configure Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});
```

### Parallel Tool Execution

Support multiple tool calls in single request:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/batch",
  "params": {
    "calls": [
      {"name": "get_world", "arguments": {"worldId": "123"}},
      {"name": "get_character", "arguments": {"characterId": "456"}}
    ]
  },
  "id": 5
}
```

## Security Best Practices

1. **Always validate OAuth tokens** on every request
2. **Use HTTPS** for all MCP endpoints
3. **Validate tool arguments** with Zod schemas
4. **Apply RLS policies** for database queries
5. **Rate limit** to prevent abuse
6. **Sanitize outputs** to prevent XSS
7. **Log tool calls** for auditing

## Additional Resources

- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [ChatGPT Apps SDK Documentation](https://platform.openai.com/docs/chatgpt-apps)
- [OAuth 2.1 RFC](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
