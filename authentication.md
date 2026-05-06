# Authentication

Armith has two authentication contexts:

1. **Dashboard user authentication** (currently Clerk-backed) for admin/dashboard actions
2. **API key authentication** for direct API consumption of KYC endpoints

## Header Format

For direct API integrations, include:

```http
x-api-key: <armith_api_key>
Content-Type: application/json
```

Dashboard-originated requests may continue to include:

```http
Authorization: Bearer <clerk_jwt_token>
Content-Type: application/json
```

## Endpoint Access Rules

### Public

- `GET /health`
- `GET /kyc/countries`
- `GET /kyc/llm-status`

### Protected

- All `POST /kyc/*` verification/upload endpoints (API key or dashboard user auth)
- `GET /kyc/status/:profileId` (API key or dashboard user auth)
- All `/admin/*` endpoints (dashboard user auth only)
- `/auth/profile`

## Typical API Key Flow

1. A dashboard user signs in and creates an API key
2. Customer backend stores the API key in a secure secret manager
3. Customer backend sends `x-api-key` with KYC requests
4. Backend validates key and resolves tenant/user context

## Common Authentication Mistakes

- Missing `x-api-key` on direct API requests
- Using a revoked API key
- Treating dashboard login token as customer API credential distribution method
- Storing API keys in client-side code

## Example Request With API Key

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: <ARMITH_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "documentType": "id-front"
  }'
```
