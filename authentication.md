# Authentication

Armith uses **three authentication contexts**:

1. **Dashboard user authentication** (Clerk) — admin, settings, webhooks, API key management
2. **API key authentication** — server-to-server KYC API consumption
3. **Capture session tokens** — scoped end-user flows without distributing API keys to clients

## API Key Format

Keys are issued as:

```text
ak_live_<secret>
```

Send them using **either**:

```http
x-api-key: ak_live_<secret>
Content-Type: application/json
```

**or**

```http
Authorization: Bearer ak_live_<secret>
Content-Type: application/json
```

::: warning
Do not send a Clerk JWT and an API key expecting both to apply. KYC middleware tries capture session → API key → Clerk session in that order.
:::

## Clerk Session (Dashboard)

Dashboard and SPA requests send:

```http
Authorization: Bearer <clerk_session_jwt>
Content-Type: application/json
```

Used for `/admin/*`, `/config` (except public presets), and `/auth/profile`.

## Capture Session Token (Embedded Flows)

For end-user capture UIs without exposing API keys:

1. Dashboard mints a token: `POST /admin/verifications/:profileId/capture-session`
2. Client sends on KYC routes:

```http
X-Verification-Session: <token>
```

The token binds to a specific `profileId` and tenant. Requires `VERIFICATION_CAPTURE_TOKEN_SECRET` on the backend.

## Endpoint Access Rules

### Public

- `GET /health`
- `GET /kyc/countries`
- `GET /kyc/llm-status`
- `GET /config/presets`

### KYC (API key, Clerk, or capture session)

- `POST /kyc/upload-url`
- `POST /kyc/secure-download-url`
- `POST /kyc/id-check`
- `POST /kyc/selfie-check`
- `GET /kyc/status/:profileId`
- `GET /kyc/sessions/:id`

### Dashboard only (Clerk)

- All `/admin/*` including webhooks, manual review, settings, API keys
- `GET /auth/profile`
- `GET /config`, `PATCH /config`, `POST /config/preset`

## IP Allowlists (Optional)

Growth/Enterprise features:

- **Account-wide:** `PUT /admin/account-api-ip-allowlist` with `{ "allowedCidrs": ["203.0.113.0/24"] }`
- **Per-key:** `PATCH /admin/api-keys/:id` with key-specific CIDR rules

Violations return `403` with `ACCOUNT_IP_FORBIDDEN` or `API_KEY_IP_FORBIDDEN`.

## Idempotency (KYC writes)

On `POST /kyc/id-check` and `POST /kyc/selfie-check`, send:

```http
Idempotency-Key: <your-unique-key>
```

- Same key + same body within 24h → cached response with `Idempotent-Replayed: true`
- Same key + different body → `409 Conflict`
- In-progress duplicate → `409`

## Typical API Key Flow

1. Dashboard user signs in → **Integrations → API Keys**
2. Create a named key per environment (e.g. `prod-backend`)
3. Store the raw token in your secret manager
4. Backend sends `x-api-key` on Armith KYC requests
5. Armith validates ownership, plan quota, and optional IP allowlists

## Common Mistakes

- Missing `x-api-key` on direct API requests
- Using a revoked API key
- Putting API keys in browser/mobile client code
- Expecting API keys to work on `/admin/*` or `/config`
- Setting `REACT_APP_*` or backend env vars in the wrong directory (frontend reads only `frontend/.env*`)

## Example: Upload URL With API Key

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "documentType": "id-front"
  }'
```
