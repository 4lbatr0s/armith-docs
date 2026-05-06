# Authentication

Armith protected APIs use Clerk authentication via Bearer token.

## Header Format

For protected endpoints, include:

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

- All `POST /kyc/*` verification/upload endpoints
- `GET /kyc/status/:profileId`
- All `/admin/*` endpoints
- `/auth/profile`

## Typical Token Flow

1. User signs in via Clerk in your application
2. Your app obtains session token from Clerk
3. Your app attaches token in `Authorization` header for API calls
4. Backend validates token and sets `req.auth`

## Common Authentication Mistakes

- Missing `Authorization` header
- Sending expired token
- Calling protected endpoint before user is signed in
- Mixing token from another Clerk instance/environment

## Example Request With Token

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "documentType": "id-front"
  }'
```
