/**
 * Template: MCP Server Route Handler
 *
 * This is a production-ready template for the Model Context Protocol server.
 * Copy to: src/app/api/mcp/route.ts
 *
 * Features:
 * - JSON-RPC 2.0 over HTTPS
 * - OAuth 2.1 token validation
 * - Tool routing with type safety
 * - Server-Sent Events for streaming
 * - CORS configured for ChatGPT
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateOAuthToken, OAuthTokenData } from '@/lib/auth/oauth';
import { mcpToolHandlers } from '@/lib/mcp/tools';

// JSON-RPC 2.0 Request Schema
const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.unknown()).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

// MCP Method Handlers
const MCP_METHODS = {
  'tools/list': listTools,
  'tools/call': callTool,
  'resources/list': listResources,
  'prompts/list': listPrompts,
} as const;

// CORS Headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://chatgpt.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * OPTIONS: CORS Preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

/**
 * POST: JSON-RPC 2.0 Request Handler
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate OAuth Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonRpcError(-32001, 'Unauthorized', null, { headers: CORS_HEADERS });
    }

    const token = authHeader.slice(7);
    const tokenData = await validateOAuthToken(token);
    if (!tokenData) {
      return jsonRpcError(-32001, 'Invalid token', null, { headers: CORS_HEADERS });
    }

    // 2. Parse JSON-RPC Request
    const body = await request.json();
    const rpcRequest = JsonRpcRequestSchema.parse(body);

    // 3. Route to Handler
    const handler = MCP_METHODS[rpcRequest.method as keyof typeof MCP_METHODS];
    if (!handler) {
      return jsonRpcError(-32601, 'Method not found', rpcRequest.id, {
        headers: CORS_HEADERS,
      });
    }

    // 4. Execute Handler
    const result = await handler(rpcRequest.params || {}, tokenData);

    // 5. Return JSON-RPC Response
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

    if (error instanceof z.ZodError) {
      return jsonRpcError(-32602, 'Invalid params', null, {
        headers: CORS_HEADERS,
        data: error.errors,
      });
    }

    if (error instanceof Error) {
      return jsonRpcError(-32603, error.message, null, { headers: CORS_HEADERS });
    }

    return jsonRpcError(-32603, 'Internal error', null, { headers: CORS_HEADERS });
  }
}

/**
 * GET: Server-Sent Events (Streaming)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode('event: connected\ndata: {"status":"ready"}\n\n')
      );

      const interval = setInterval(() => {
        controller.enqueue(encoder.encode('event: ping\ndata: {}\n\n'));
      }, 30000);

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

// ============================================================================
// Helper Functions
// ============================================================================

function jsonRpcError(code: number, message: string, id: any, options?: any) {
  return NextResponse.json(
    {
      jsonrpc: '2.0',
      error: { code, message, ...(options?.data && { data: options.data }) },
      id,
    },
    { status: 200, ...options }
  );
}

// ============================================================================
// MCP Handlers
// ============================================================================

/**
 * Handler: tools/list
 * Returns all available MCP tools with schemas
 */
async function listTools() {
  // Load from generated tool schemas
  const { MCP_TOOL_SCHEMAS } = await import('@/lib/mcp/tool-schemas.json');
  return { tools: MCP_TOOL_SCHEMAS };
}

/**
 * Handler: tools/call
 * Executes a tool with validated arguments
 */
async function callTool(params: any, tokenData: OAuthTokenData) {
  const { name, arguments: args } = params;

  // Route to tool handler
  const handler = mcpToolHandlers[name as keyof typeof mcpToolHandlers];
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

/**
 * Handler: resources/list
 * Returns available resources (optional)
 */
async function listResources() {
  return {
    resources: [
      {
        uri: 'worlds://list',
        name: 'User Worlds',
        description: 'List of all worlds',
        mimeType: 'application/json',
      },
    ],
  };
}

/**
 * Handler: prompts/list
 * Returns conversation starters (optional)
 */
async function listPrompts() {
  return {
    prompts: [
      {
        name: 'start-fantasy-world',
        description: 'Start creating a fantasy world',
        arguments: [
          {
            name: 'theme',
            description: 'Fantasy subgenre',
            required: false,
          },
        ],
      },
    ],
  };
}
