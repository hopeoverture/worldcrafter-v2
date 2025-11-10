/**
 * Template: OAuth 2.1 Protected Resource Metadata
 *
 * This route provides OAuth authorization server metadata for ChatGPT Apps SDK.
 * Copy to: src/app/.well-known/oauth-protected-resource/route.ts
 *
 * Implements RFC 8414: OAuth 2.0 Authorization Server Metadata
 */

import { NextResponse } from 'next/server';

/**
 * GET: OAuth Protected Resource Metadata
 *
 * Returns metadata about the OAuth 2.1 authorization server,
 * supported grant types, scopes, and MCP endpoints.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SUPABASE_URL not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    // RFC 8414: Authorization Server Metadata
    issuer: supabaseUrl,
    authorization_endpoint: `${supabaseUrl}/auth/v1/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/token`,
    revocation_endpoint: `${supabaseUrl}/auth/v1/logout`,

    // Resource Server Metadata
    resource: baseUrl,
    service_endpoint: `${baseUrl}/api/mcp`,

    // Supported Scopes
    scopes_supported: [
      'worlds:read', // Read access to worlds
      'worlds:write', // Create/update worlds
      'worlds:share', // Share worlds with others
    ],

    // Grant Types (OAuth 2.1 with PKCE)
    grant_types_supported: ['authorization_code', 'refresh_token'],

    // PKCE Required (S256 only)
    code_challenge_methods_supported: ['S256'],

    // Response Types
    response_types_supported: ['code'],
    response_modes_supported: ['query', 'fragment'],

    // Token Endpoint Authentication
    token_endpoint_auth_methods_supported: [
      'client_secret_post',
      'client_secret_basic',
    ],

    // Registration
    registration_endpoint: `${baseUrl}/api/oauth/register`,

    // Widget Endpoints
    widget_endpoints: {
      'character-card': `${baseUrl}/api/widgets/character-card.html`,
      'world-card': `${baseUrl}/api/widgets/world-card.html`,
      'location-card': `${baseUrl}/api/widgets/location-card.html`,
      'character-sheet': `${baseUrl}/api/widgets/character-sheet.html`,
      'relationship-graph': `${baseUrl}/api/widgets/relationship-graph.html`,
      'world-dashboard': `${baseUrl}/api/widgets/world-dashboard.html`,
    },

    // Additional Metadata
    ui_locales_supported: ['en-US'],
    service_documentation: `${baseUrl}/docs/api`,
    op_policy_uri: `${baseUrl}/privacy`,
    op_tos_uri: `${baseUrl}/terms`,
  });
}

/**
 * OPTIONS: CORS Preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': 'https://chatgpt.com',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}
