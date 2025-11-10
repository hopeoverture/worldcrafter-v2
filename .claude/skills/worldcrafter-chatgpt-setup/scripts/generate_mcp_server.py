#!/usr/bin/env python3
"""
Generate MCP server route handler from tool definitions

This script creates a production-ready Next.js API route for the Model Context
Protocol server with JSON-RPC 2.0, OAuth validation, and tool routing.

Usage:
    python generate_mcp_server.py

Output:
    src/app/api/mcp/route.ts - Complete MCP server implementation
"""

import json
from pathlib import Path
from typing import List, Dict, Any

# Import tool schemas
TOOL_SCHEMAS_FILE = Path('src/lib/mcp/tool-schemas.json')


def load_tool_schemas() -> List[Dict[str, Any]]:
    """Load tool schemas from JSON file"""
    if not TOOL_SCHEMAS_FILE.exists():
        print(f"Error: Tool schemas not found at {TOOL_SCHEMAS_FILE}")
        print("Run generate_tool_schemas.py first!")
        return []

    with open(TOOL_SCHEMAS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('tools', [])


def generate_tools_list_handler(tools: List[Dict[str, Any]]) -> str:
    """Generate tools/list handler with complete tool definitions"""
    tools_json = json.dumps(tools, indent=6)

    return f"""
// Handler: List available tools
async function listTools() {{
  return {{
    tools: {tools_json}
  }};
}}
"""


def generate_tool_router(tools: List[Dict[str, Any]]) -> str:
    """Generate tool routing logic"""
    tool_names = [tool['name'] for tool in tools]

    cases = []
    for name in tool_names:
        cases.append(f"""    case '{name}':
      return await mcpToolHandlers.{name}(args, tokenData.userId);""")

    cases_str = '\n'.join(cases)

    return f"""
// Handler: Call a tool
async function callTool(params: any, tokenData: OAuthTokenData) {{
  const {{ name, arguments: args }} = params;

  // Route to tool handler
  let result: any;

  switch (name) {{
{cases_str}
    default:
      throw new Error(`Tool not found: ${{name}}`);
  }}

  return {{
    content: [
      {{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }},
    ],
  }};
}}
"""


def generate_mcp_route(tools: List[Dict[str, Any]]) -> str:
    """Generate complete MCP route handler"""

    tools_list = generate_tools_list_handler(tools)
    tool_router = generate_tool_router(tools)

    return f"""import {{ NextRequest, NextResponse }} from 'next/server';
import {{ z }} from 'zod';
import {{ validateOAuthToken, OAuthTokenData }} from '@/lib/auth/oauth';
import {{ mcpToolHandlers }} from '@/lib/mcp/tools';

/**
 * Model Context Protocol (MCP) Server
 *
 * Implements JSON-RPC 2.0 over HTTPS for ChatGPT Apps SDK integration.
 * All requests require valid OAuth 2.1 bearer token.
 *
 * Supported methods:
 * - tools/list: Return available tools
 * - tools/call: Execute a tool
 * - resources/list: List available resources
 * - prompts/list: List available prompts
 */

// JSON-RPC 2.0 Schemas
const JsonRpcRequestSchema = z.object({{
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
}});

const JsonRpcErrorSchema = z.object({{
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional(),
}});

// MCP Protocol Methods
const MCP_METHODS = {{
  'tools/list': listTools,
  'tools/call': callTool,
  'resources/list': listResources,
  'prompts/list': listPrompts,
}} as const;

// CORS headers for ChatGPT
const CORS_HEADERS = {{
  'Access-Control-Allow-Origin': 'https://chatgpt.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}};

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {{
  return NextResponse.json({{}}, {{ headers: CORS_HEADERS }});
}}

/**
 * POST handler for JSON-RPC requests
 */
export async function POST(request: NextRequest) {{
  try {{
    // 1. Validate OAuth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {{
      return jsonRpcError(-32001, 'Unauthorized: Missing or invalid Authorization header', null, {{
        headers: CORS_HEADERS,
      }});
    }}

    const token = authHeader.slice(7);
    const tokenData = await validateOAuthToken(token);
    if (!tokenData) {{
      return jsonRpcError(-32001, 'Unauthorized: Invalid or expired token', null, {{
        headers: CORS_HEADERS,
      }});
    }}

    // 2. Parse JSON-RPC request
    const body = await request.json();
    const rpcRequest = JsonRpcRequestSchema.parse(body);

    // 3. Route to handler
    const handler = MCP_METHODS[rpcRequest.method as keyof typeof MCP_METHODS];
    if (!handler) {{
      return jsonRpcError(-32601, `Method not found: ${{rpcRequest.method}}`, rpcRequest.id, {{
        headers: CORS_HEADERS,
      }});
    }}

    // 4. Execute handler
    const result = await handler(rpcRequest.params || {{}}, tokenData);

    // 5. Return JSON-RPC response
    return NextResponse.json(
      {{
        jsonrpc: '2.0',
        result,
        id: rpcRequest.id,
      }},
      {{ headers: CORS_HEADERS }}
    );
  }} catch (error) {{
    console.error('MCP Server Error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {{
      return jsonRpcError(-32602, 'Invalid params', null, {{
        headers: CORS_HEADERS,
        data: error.errors,
      }});
    }}

    // Handle tool execution errors
    if (error instanceof Error) {{
      return jsonRpcError(-32603, `Internal error: ${{error.message}}`, null, {{
        headers: CORS_HEADERS,
      }});
    }}

    return jsonRpcError(-32603, 'Unknown internal error', null, {{
      headers: CORS_HEADERS,
    }});
  }}
}}

/**
 * GET handler for Server-Sent Events (streaming)
 * Used for long-running operations and real-time updates
 */
export async function GET(request: NextRequest) {{
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {{
    return new Response('Unauthorized', {{ status: 401 }});
  }}

  const token = authHeader.slice(7);
  const tokenData = await validateOAuthToken(token);
  if (!tokenData) {{
    return new Response('Unauthorized', {{ status: 401 }});
  }}

  const encoder = new TextEncoder();
  const stream = new ReadableStream({{
    async start(controller) {{
      // Send initial connection event
      controller.enqueue(
        encoder.encode('event: connected\\ndata: {{"status":"ready"}}\\n\\n')
      );

      // Keep-alive ping every 30s
      const interval = setInterval(() => {{
        controller.enqueue(encoder.encode('event: ping\\ndata: {{}}\\n\\n'));
      }}, 30000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {{
        clearInterval(interval);
        controller.close();
      }});
    }},
  }});

  return new Response(stream, {{
    headers: {{
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...CORS_HEADERS,
    }},
  }});
}}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create JSON-RPC error response
 */
function jsonRpcError(
  code: number,
  message: string,
  id: any,
  options?: {{ headers?: any; data?: any }}
) {{
  return NextResponse.json(
    {{
      jsonrpc: '2.0',
      error: {{
        code,
        message,
        ...(options?.data && {{ data: options.data }}),
      }},
      id,
    }},
    {{ status: 200, headers: options?.headers }}
  );
}}

// ============================================================================
// MCP Method Handlers
// ============================================================================

{tools_list}

{tool_router}

/**
 * Handler: List resources (optional MCP feature)
 * Resources are data sources that can be referenced by tools
 */
async function listResources() {{
  return {{
    resources: [
      {{
        uri: 'worlds://list',
        name: 'User Worlds',
        description: 'List of all worlds created by the user',
        mimeType: 'application/json',
      }},
    ],
  }};
}}

/**
 * Handler: List prompts (optional MCP feature)
 * Prompts are pre-defined conversation starters
 */
async function listPrompts() {{
  return {{
    prompts: [
      {{
        name: 'start-fantasy-world',
        description: 'Start creating a fantasy world',
        arguments: [
          {{
            name: 'theme',
            description: 'Fantasy subgenre',
            required: false,
          }},
        ],
      }},
      {{
        name: 'add-character',
        description: 'Add a character to existing world',
        arguments: [
          {{
            name: 'worldId',
            description: 'World ID',
            required: true,
          }},
        ],
      }},
    ],
  }};
}}
"""


def main():
    """Generate MCP server route"""
    print("Generating MCP server route...")

    # Load tool schemas
    tools = load_tool_schemas()
    if not tools:
        print("No tools found. Exiting.")
        return

    print(f"  Loaded {len(tools)} tool schemas")

    # Generate route handler
    route_content = generate_mcp_route(tools)

    # Write to file
    output_file = Path('src/app/api/mcp/route.ts')
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(route_content, encoding='utf-8')

    print(f"\n✓ Generated MCP server route")
    print(f"  Output: {output_file}")
    print(f"  Tools: {len(tools)}")
    print(f"\nNext steps:")
    print(f"  1. Implement tool handlers in src/lib/mcp/tools/")
    print(f"  2. Create OAuth validation in src/lib/auth/oauth.ts")
    print(f"  3. Test with: curl -X POST http://localhost:3000/api/mcp")


if __name__ == '__main__':
    main()
