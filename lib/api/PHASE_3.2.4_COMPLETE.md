# Phase 3.2.4: Public Evidence API - Complete ✅

## Summary

Phase 3.2.4 implements a public API for accessing sources, stacks, and evidence data with API key authentication, rate limiting, and full OpenAPI documentation.

## Completed Components

### 1. Schema: ApiKey Model

**File**: [lib/models/schema.prisma](../lib/models/schema.prisma)

Added:
- `ApiKeyTier` enum: `free`, `pro`, `partner`, `unlimited`
- `ApiKey` model with:
  - Secure key hash storage
  - Scopes for permission control
  - Tier-based rate limiting
  - Usage tracking
  - Revocation support

### 2. API Key Generation & Validation

**File**: [lib/api/keys.ts](keys.ts)

Key exports:
- `generateApiKey(userId, name, options)` - Create new API key
- `validateApiKey(key)` - Validate and return key data
- `revokeApiKey(keyId, userId, reason)` - Revoke a key
- `listApiKeys(userId)` - List user's keys
- `updateApiKey(keyId, userId, updates)` - Update key settings
- `API_SCOPES` - Available permission scopes

**Security:**
- Keys are SHA-256 hashed before storage
- Only the prefix is stored for identification
- Full key shown only once at creation

### 3. Rate Limiting

**File**: [lib/api/rateLimit.ts](rateLimit.ts)

Features:
- Redis-based sliding window rate limiting
- Tier-based limits:
  | Tier | Requests/Hour |
  |------|---------------|
  | free | 100 |
  | pro | 1,000 |
  | partner | 10,000 |
  | unlimited | ∞ |
- Custom rate limit override per key
- Standard rate limit headers

### 4. API Middleware

**File**: [lib/api/middleware.ts](middleware.ts)

Key exports:
- `apiMiddleware(req, requiredScopes)` - Full auth/rate limit check
- `apiSuccess(data)` - Wrap successful responses
- `apiPaginated(data, pagination)` - Paginated responses
- `apiError(code, message, status)` - Error responses
- `withApiAuth(handler, scopes)` - Handler wrapper
- `handleCorsPreFlight(req)` - CORS support

### 5. Public Sources API

**Files**:
- [app/api/v1/sources/route.ts](../../app/api/v1/sources/route.ts) - Search sources
- [app/api/v1/sources/[sourceId]/route.ts](../../app/api/v1/sources/%5BsourceId%5D/route.ts) - Get source

**Endpoints:**

```
GET /api/v1/sources
  ?q=search term
  ?doi=10.1234/example
  ?type=article
  ?verified=true
  ?limit=20
  ?cursor=abc123

GET /api/v1/sources/{sourceId}
  ?include=citations,stacks
```

### 6. Public Stacks API

**Files**:
- [app/api/v1/stacks/route.ts](../../app/api/v1/stacks/route.ts) - Search stacks
- [app/api/v1/stacks/[stackId]/route.ts](../../app/api/v1/stacks/%5BstackId%5D/route.ts) - Get stack

**Endpoints:**

```
GET /api/v1/stacks
  ?q=search term
  ?userId=123
  ?visibility=public_open
  ?limit=20
  ?cursor=abc123

GET /api/v1/stacks/{stackId}
  ?include=items,collaborators
  ?itemLimit=50
```

### 7. API Key Management Endpoints

**Files**:
- [app/api/settings/api-keys/route.ts](../../app/api/settings/api-keys/route.ts) - List/create keys
- [app/api/settings/api-keys/[keyId]/route.ts](../../app/api/settings/api-keys/%5BkeyId%5D/route.ts) - Manage key

**Endpoints:**

```
GET  /api/settings/api-keys          # List user's API keys
POST /api/settings/api-keys          # Create new key
GET  /api/settings/api-keys/{keyId}  # Get key details
PATCH /api/settings/api-keys/{keyId} # Update key
DELETE /api/settings/api-keys/{keyId} # Revoke key
```

### 8. OpenAPI Specification

**Files**:
- [lib/api/openapi.ts](openapi.ts) - Full OpenAPI 3.0 spec
- [app/api/v1/openapi.json/route.ts](../../app/api/v1/openapi.json/route.ts) - Spec endpoint

**Endpoint:**
```
GET /api/v1/openapi.json
```

## Usage Examples

### Authentication

```bash
curl -H "Authorization: Bearer mesh_pk_abc123..." \
  https://mesh.app/api/v1/sources
```

### Search Sources

```bash
curl -H "Authorization: Bearer mesh_pk_..." \
  "https://mesh.app/api/v1/sources?q=climate+change&limit=10"
```

### Get Source with Citations

```bash
curl -H "Authorization: Bearer mesh_pk_..." \
  "https://mesh.app/api/v1/sources/source123?include=citations"
```

### Create API Key (authenticated user)

```bash
curl -X POST https://mesh.app/api/settings/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "scopes": ["read:sources", "read:stacks"]}'
```

## Files Created

| File | Purpose |
|------|---------|
| `lib/api/keys.ts` | API key generation and validation |
| `lib/api/rateLimit.ts` | Redis-based rate limiting |
| `lib/api/middleware.ts` | Auth/rate limit middleware |
| `lib/api/openapi.ts` | OpenAPI 3.0 specification |
| `lib/api/index.ts` | Barrel export |
| `app/api/v1/sources/route.ts` | Search sources |
| `app/api/v1/sources/[sourceId]/route.ts` | Get source |
| `app/api/v1/stacks/route.ts` | Search stacks |
| `app/api/v1/stacks/[stackId]/route.ts` | Get stack |
| `app/api/v1/openapi.json/route.ts` | OpenAPI spec endpoint |
| `app/api/settings/api-keys/route.ts` | List/create keys |
| `app/api/settings/api-keys/[keyId]/route.ts` | Manage key |

## Schema Changes

Added to `lib/models/schema.prisma`:
- `ApiKeyTier` enum
- `ApiKey` model
- `apiKeys` relation on User model

## Rate Limit Headers

All API responses include:
- `X-RateLimit-Limit`: Maximum requests per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp of reset

When rate limited (429):
- `Retry-After`: Seconds until retry allowed

## Available Scopes

| Scope | Description |
|-------|-------------|
| `read:sources` | Read source data |
| `read:stacks` | Read public stacks |
| `read:citations` | Read citations/evidence |
| `write:sources` | Create and update sources |
| `write:stacks` | Create and update stacks |

## Phase 3.2 Complete! ✅

With Phase 3.2.4 complete, all of Phase 3.2: Integration & Interoperability is now finished:

- ✅ 3.2.1: Academic Database Integration
- ✅ 3.2.2: Reference Manager Sync
- ✅ 3.2.3: Embeddable Evidence Widgets
- ✅ 3.2.4: Public Evidence API
