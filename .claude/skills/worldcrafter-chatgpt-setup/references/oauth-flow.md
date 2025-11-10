# OAuth 2.1 Authorization Flow Reference

Complete guide to implementing OAuth 2.1 with PKCE for ChatGPT Apps SDK integration.

## Overview

OAuth 2.1 is a modern authorization framework that enables secure third-party access to user resources. For ChatGPT Apps SDK, we use the Authorization Code flow with PKCE (Proof Key for Code Exchange) to ensure secure token exchange.

**Key Components:**
- **Authorization Server**: Supabase Auth
- **Resource Server**: WorldCrafter MCP API
- **Client**: ChatGPT
- **User**: WorldCrafter user

## OAuth 2.1 vs OAuth 2.0

OAuth 2.1 consolidates OAuth 2.0 best practices:

✅ **Required:**
- PKCE (S256 code challenge method)
- Redirect URI exact match
- Authorization code single-use
- Short-lived access tokens (1 hour)

❌ **Removed:**
- Implicit flow (insecure)
- Password grant (insecure)
- Bearer token in query params

## Authorization Flow

### Step-by-Step Flow

```
User                ChatGPT              WorldCrafter         Supabase Auth
 |                      |                       |                    |
 |--1. Connect App----->|                       |                    |
 |                      |                       |                    |
 |                      |--2. Discover Metadata->|                   |
 |                      |<--OAuth endpoints------|                   |
 |                      |                       |                    |
 |                      |--3. Generate PKCE---->|                    |
 |                      |   code_verifier       |                    |
 |                      |   code_challenge       |                    |
 |                      |                       |                    |
 |                      |--4. Authorization Request---------------->|
 |                      |   (code_challenge, client_id, scope)       |
 |                      |                       |                    |
 |<----------------5. User Consent Screen-------------------------|
 | "ChatGPT wants to access your worlds"       |                    |
 |--6. Approve Consent----------------------------------------------->|
 |                      |                       |                    |
 |                      |<-7. Authorization Code--------------------|
 |                      |   (one-time code)     |                    |
 |                      |                       |                    |
 |                      |--8. Token Request----------------------------->|
 |                      |   (code, code_verifier, client_secret)    |
 |                      |<--9. Access Token + Refresh Token---------|
 |                      |                       |                    |
 |                      |--10. MCP Request----->|                    |
 |                      |   (Bearer token)      |                    |
 |                      |                       |--11. Validate Token->|
 |                      |                       |<--User ID, scopes-|
 |                      |<--12. MCP Response----|                    |
```

## Protected Resource Metadata

ChatGPT discovers OAuth endpoints via `/.well-known/oauth-protected-resource`.

### Metadata Endpoint

**URL**: `https://worldcrafter.app/.well-known/oauth-protected-resource`

**Response:**
```json
{
  "issuer": "https://your-project.supabase.co",
  "authorization_endpoint": "https://your-project.supabase.co/auth/v1/authorize",
  "token_endpoint": "https://your-project.supabase.co/auth/v1/token",
  "revocation_endpoint": "https://your-project.supabase.co/auth/v1/logout",
  "resource": "https://worldcrafter.app",
  "service_endpoint": "https://worldcrafter.app/api/mcp",
  "scopes_supported": [
    "worlds:read",
    "worlds:write",
    "worlds:share"
  ],
  "grant_types_supported": [
    "authorization_code",
    "refresh_token"
  ],
  "code_challenge_methods_supported": ["S256"],
  "response_types_supported": ["code"],
  "response_modes_supported": ["query", "fragment"],
  "token_endpoint_auth_methods_supported": [
    "client_secret_post",
    "client_secret_basic"
  ],
  "registration_endpoint": "https://worldcrafter.app/api/oauth/register",
  "widget_endpoints": {
    "character-card": "https://worldcrafter.app/api/widgets/character-card.html",
    "world-card": "https://worldcrafter.app/api/widgets/world-card.html"
  }
}
```

## PKCE (Proof Key for Code Exchange)

PKCE prevents authorization code interception attacks.

### Code Verifier Generation

```typescript
import crypto from 'crypto';

function generateCodeVerifier(): string {
  // Generate 32 random bytes
  const buffer = crypto.randomBytes(32);

  // Base64URL encode
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Example: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### Code Challenge Generation

```typescript
function generateCodeChallenge(verifier: string): string {
  // SHA-256 hash
  const hash = crypto.createHash('sha256').update(verifier).digest();

  // Base64URL encode
  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Example: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
```

**IMPORTANT**: Only S256 challenge method is supported (not "plain").

## Authorization Request

ChatGPT initiates the flow by redirecting the user to Supabase authorization endpoint.

### Request Parameters

```http
GET /auth/v1/authorize?
  client_id=chatgpt-client-id&
  response_type=code&
  redirect_uri=https://chatgpt.com/oauth/callback&
  scope=worlds:read%20worlds:write&
  state=random-state-string&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

**Parameters:**
- `client_id`: ChatGPT's client ID (registered with Supabase)
- `response_type`: Always `code`
- `redirect_uri`: ChatGPT's callback URL (must match registered URI)
- `scope`: Space-separated scopes (e.g., `worlds:read worlds:write`)
- `state`: Random string to prevent CSRF
- `code_challenge`: SHA-256 hash of code_verifier (Base64URL)
- `code_challenge_method`: Always `S256`

### User Consent Screen

Supabase displays consent screen:

```
ChatGPT wants to access your WorldCrafter account

Permissions requested:
✓ View your worlds (worlds:read)
✓ Create and edit worlds (worlds:write)

[Approve] [Deny]
```

### Authorization Response

After user approval, Supabase redirects to ChatGPT with authorization code:

```http
HTTP/1.1 302 Found
Location: https://chatgpt.com/oauth/callback?
  code=4/0AX4XfWi...&
  state=random-state-string
```

**Success Parameters:**
- `code`: One-time authorization code (10 min expiry)
- `state`: Same state from request (ChatGPT validates)

**Error Response:**
```http
Location: https://chatgpt.com/oauth/callback?
  error=access_denied&
  error_description=User%20denied%20consent&
  state=random-state-string
```

## Token Exchange

ChatGPT exchanges authorization code for access token.

### Token Request

```http
POST /auth/v1/token HTTP/1.1
Host: your-project.supabase.co
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=4/0AX4XfWi...&
redirect_uri=https://chatgpt.com/oauth/callback&
client_id=chatgpt-client-id&
client_secret=chatgpt-client-secret&
code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**Parameters:**
- `grant_type`: Always `authorization_code`
- `code`: Authorization code from previous step
- `redirect_uri`: Same as authorization request
- `client_id`: ChatGPT client ID
- `client_secret`: ChatGPT client secret
- `code_verifier`: Original verifier (Supabase validates against challenge)

### Token Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "v1.MR7jT9XZ...",
  "scope": "worlds:read worlds:write"
}
```

**Fields:**
- `access_token`: JWT bearer token (1 hour expiry)
- `token_type`: Always `Bearer`
- `expires_in`: Seconds until expiration (3600 = 1 hour)
- `refresh_token`: Used to get new access token
- `scope`: Granted scopes (may differ from requested)

### Token Error Response

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid authorization code"
}
```

**Error Codes:**
- `invalid_request`: Missing required parameter
- `invalid_client`: Invalid client credentials
- `invalid_grant`: Invalid/expired authorization code
- `unauthorized_client`: Client not authorized for this grant type
- `unsupported_grant_type`: Grant type not supported

## Token Validation

WorldCrafter validates every MCP request token.

### Validation Steps

```typescript
import { createClient } from '@/lib/supabase/server';

export async function validateOAuthToken(token: string) {
  try {
    const supabase = await createClient();

    // 1. Verify JWT signature and expiration
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    // 2. Extract scopes from token metadata
    const scopes = (data.user.user_metadata?.scopes as string[]) || [];

    // 3. Return validated token data
    return {
      userId: data.user.id,
      email: data.user.email!,
      scopes,
      user: data.user,
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}
```

### Scope Validation

```typescript
export function validateScope(tokenData: OAuthTokenData, requiredScope: string): boolean {
  return tokenData.scopes.includes(requiredScope);
}

// Usage in tool handler
async function createWorld(args: any, userId: string) {
  const tokenData = await validateOAuthToken(token);

  if (!validateScope(tokenData, 'worlds:write')) {
    throw new Error('Insufficient permissions: worlds:write required');
  }

  // Proceed with world creation
}
```

## Refresh Token Flow

Access tokens expire after 1 hour. Use refresh token to get new access token.

### Refresh Request

```http
POST /auth/v1/token HTTP/1.1
Host: your-project.supabase.co
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
refresh_token=v1.MR7jT9XZ...&
client_id=chatgpt-client-id&
client_secret=chatgpt-client-secret
```

**Parameters:**
- `grant_type`: Always `refresh_token`
- `refresh_token`: Refresh token from original token response
- `client_id`: ChatGPT client ID
- `client_secret`: ChatGPT client secret

### Refresh Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "v1.NEW_REFRESH_TOKEN...",
  "scope": "worlds:read worlds:write"
}
```

**Note**: Supabase may issue a new refresh token (refresh token rotation).

## Token Revocation

Users can revoke ChatGPT's access.

### Revocation Request

```http
POST /auth/v1/logout HTTP/1.1
Host: your-project.supabase.co
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&
token_type_hint=access_token
```

**Parameters:**
- `token`: Token to revoke (access or refresh)
- `token_type_hint`: `access_token` or `refresh_token`

**Response:**
```http
HTTP/1.1 200 OK

{}
```

Revocation always returns 200 (even if token invalid).

## Scope Definitions

Define fine-grained permissions for ChatGPT access.

### WorldCrafter Scopes

| Scope | Description | Example Actions |
|-------|-------------|-----------------|
| `worlds:read` | Read-only access to user's worlds | View worlds, characters, locations |
| `worlds:write` | Create and modify worlds | Create world, add character, update location |
| `worlds:share` | Share worlds with others | Export world, generate share link |

### Scope Enforcement

```typescript
// In tool handler
const SCOPE_REQUIREMENTS = {
  get_world: ['worlds:read'],
  create_world: ['worlds:write'],
  update_world: ['worlds:write'],
  export_world: ['worlds:share'],
} as const;

async function callTool(toolName: string, args: any, tokenData: OAuthTokenData) {
  const requiredScopes = SCOPE_REQUIREMENTS[toolName];

  if (requiredScopes) {
    const hasPermission = requiredScopes.some((scope) =>
      tokenData.scopes.includes(scope)
    );

    if (!hasPermission) {
      throw new Error(
        `Insufficient permissions. Required: ${requiredScopes.join(' or ')}`
      );
    }
  }

  // Execute tool
}
```

## Dynamic Client Registration

Allow ChatGPT to register as OAuth client programmatically.

### Registration Endpoint

**URL**: `https://worldcrafter.app/api/oauth/register`

### Registration Request

```http
POST /api/oauth/register HTTP/1.1
Host: worldcrafter.app
Content-Type: application/json

{
  "client_name": "ChatGPT",
  "redirect_uris": [
    "https://chatgpt.com/oauth/callback"
  ],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "worlds:read worlds:write worlds:share",
  "token_endpoint_auth_method": "client_secret_post"
}
```

### Registration Response

```json
{
  "client_id": "chatgpt-abc123",
  "client_secret": "secret-xyz789",
  "client_id_issued_at": 1609459200,
  "client_secret_expires_at": 0,
  "client_name": "ChatGPT",
  "redirect_uris": [
    "https://chatgpt.com/oauth/callback"
  ],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "worlds:read worlds:write worlds:share"
}
```

**Implementation:**
```typescript
// src/app/api/oauth/register/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate request
  if (!body.client_name || !body.redirect_uris) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Create client in database
  const client = await prisma.oAuthClient.create({
    data: {
      name: body.client_name,
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      redirectUris: body.redirect_uris,
      grantTypes: body.grant_types,
      scopes: body.scope.split(' '),
    },
  });

  return NextResponse.json({
    client_id: client.clientId,
    client_secret: client.clientSecret,
    client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
    client_secret_expires_at: 0,
    ...body,
  });
}
```

## Security Best Practices

### 1. PKCE Always Required

```typescript
// Reject requests without PKCE
if (!code_challenge || code_challenge_method !== 'S256') {
  return { error: 'invalid_request', error_description: 'PKCE required' };
}
```

### 2. Redirect URI Validation

```typescript
// Exact match only (no wildcards)
const registeredUri = 'https://chatgpt.com/oauth/callback';
if (redirect_uri !== registeredUri) {
  return { error: 'invalid_request', error_description: 'Invalid redirect_uri' };
}
```

### 3. State Parameter Validation

```typescript
// ChatGPT must validate state matches original request
if (state !== originalState) {
  throw new Error('CSRF attack detected');
}
```

### 4. Authorization Code Single-Use

```typescript
// Mark code as used in database
await prisma.authorizationCode.update({
  where: { code },
  data: { used: true },
});

// Reject if already used
if (existingCode.used) {
  return { error: 'invalid_grant' };
}
```

### 5. Short Token Expiry

```typescript
// Access tokens: 1 hour
const ACCESS_TOKEN_EXPIRY = 60 * 60; // 3600 seconds

// Authorization codes: 10 minutes
const AUTH_CODE_EXPIRY = 10 * 60; // 600 seconds
```

### 6. Secure Token Storage

- Store tokens in HTTP-only cookies (not localStorage)
- Use Supabase's built-in session management
- Implement CSRF protection

## Testing OAuth Flow

### Manual Testing

1. **Get metadata:**
```bash
curl https://worldcrafter.app/.well-known/oauth-protected-resource
```

2. **Open browser to authorization URL:**
```
https://your-project.supabase.co/auth/v1/authorize?
  client_id=test-client&
  response_type=code&
  redirect_uri=http://localhost:3000/callback&
  scope=worlds:read&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256&
  state=random123
```

3. **Exchange code for token:**
```bash
curl -X POST https://your-project.supabase.co/auth/v1/token \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=test-client" \
  -d "client_secret=test-secret" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

### Integration Tests

```typescript
// tests/oauth.test.ts
describe('OAuth 2.1 Flow', () => {
  it('should complete full authorization flow', async () => {
    // 1. Generate PKCE
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    // 2. Request authorization
    const authUrl = `${SUPABASE_URL}/auth/v1/authorize?...`;
    // Open in browser, user approves

    // 3. Exchange code
    const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authCode,
        code_verifier: verifier,
        ...
      }),
    });

    const tokens = await tokenResponse.json();
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();

    // 4. Use access token
    const mcpResponse = await fetch(`${BASE_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      }),
    });

    expect(mcpResponse.status).toBe(200);
  });
});
```

## Additional Resources

- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
