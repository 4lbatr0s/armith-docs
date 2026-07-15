# Authentication

Armith uses **three authentication contexts**:

1. **Dashboard user authentication** (Clerk) — admin, settings, webhooks, API key management
2. **API key authentication** — server-to-server KYC API consumption
3. **Capture session tokens** — scoped end-user flows without distributing API keys to clients

## API Key Format

Keys are issued as:

```text
ak_live_<secret>   # Live environment — calls Groq LLM, consumes quota
ak_test_<secret>   # Sandbox environment — uses deterministic fixtures, no quota
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

### Sandbox vs Live

| Environment | Key prefix | LLM calls | Quota consumption | Use case |
|-------------|-----------|-----------|-------------------|----------|
| `ak_live_` | Live | Real Groq calls | Yes | Production traffic |
| `ak_test_` | Sandbox | Deterministic fixtures | No | Integration testing |

Sandbox keys support the `sandboxScenario` parameter on verification endpoints — see [Sandbox Testing](/sandbox-testing).

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

Two token modes exist:

| Mode | Scope | Usage |
|------|-------|-------|
| `kycCaptureWrite` | Full read/write — upload, verify, check | Hosted capture flows |
| `captureSession` | Read-only — status polling | Embedded status widgets |

## Endpoint Access Rules

### Public

- `GET /health`
- `GET /health/ready`
- `GET /kyc/countries`
- `GET /kyc/llm-status`
- `GET /config/presets`

### KYC (API key, Clerk, or capture session)

- `POST /kyc/upload-url`
- `POST /kyc/secure-download-url`
- `POST /kyc/id-check`
- `POST /kyc/selfie-check`
- `POST /kyc/eid-check`
- `GET /kyc/status/:profileId`
- `GET /kyc/sessions/:id`

### Integrator-only (API key required)

- `POST /kyc/profiles`
- `POST /kyc/hosted-sessions`
- `POST /kyc/profiles/:profileId/sessions`
- `POST /kyc/sessions/complete`
- `POST /kyc/sessions/result-code`

### Dashboard only (Clerk)

- All `/admin/*` including webhooks, manual review, settings, API keys
- `GET /auth/profile`
- `GET /config`, `PATCH /config`, `POST /config/preset`

## IP Allowlists (Optional)

Armith supports two levels of IP restriction:

### Account-wide allowlist

Applies to **all API keys** for the tenant. Configure via:

```http
PUT /admin/account-api-ip-allowlist
Content-Type: application/json
Authorization: Bearer <clerk_jwt>

{
  "allowedCidrs": ["203.0.113.0/24", "198.51.100.0/24"]
}
```

- Up to **24 CIDR rules**
- When non-empty, all API key requests must originate from a matching IP
- Violations return `403` with `ACCOUNT_IP_FORBIDDEN`

### Per-key allowlist

Available on **Growth** and **Enterprise** plans (`features.perKeyIpAllowlist`). Restrict individual API keys to specific IPs:

```http
PATCH /admin/api-keys/:id
Content-Type: application/json
Authorization: Bearer <clerk_jwt>

{
  "allowedCidrs": ["10.0.0.0/8"]
}
```

Both IP allowlist layers are evaluated independently — the request must pass both.

## Idempotency (KYC writes)

On `POST /kyc/id-check`, `POST /kyc/selfie-check`, and `POST /kyc/eid-check`, send:

```http
Idempotency-Key: <your-unique-key>
```

Prevents duplicate charges and processing on retries. Semantics:

- Same key + same body within 24h → cached response with `Idempotent-Replayed: true`
- Same key + different body → `409 Conflict`
- In-progress duplicate → `409 Conflict`

Storage uses `IdempotencyLedger` collection with automatic TTL expiry.

## Correlation ID (Request Tracing)

Send an optional `X-Correlation-Id` header to correlate requests across services:

```http
X-Correlation-Id: order-abc-123
```

- Max 128 characters
- Echoed in responses and webhook payloads
- UUID v4 fallback when not provided

## Typical API Key Flow

1. Dashboard user signs in → **Integrations → API Keys**
2. Create a named key per environment (e.g. `prod-backend`, `staging-backend`)
3. Select environment (`live` or `sandbox`)
4. Store the raw token in your secret manager
5. Backend sends `x-api-key` on Armith KYC requests
6. Armith validates ownership, plan quota, and optional IP allowlists

## Common Mistakes

- Missing `x-api-key` on direct API requests
- Using a revoked API key
- Putting API keys in browser/mobile client code
- Expecting API keys to work on `/admin/*` or `/config`
- Using `ak_live_` keys for testing (use `ak_test_` for sandbox)
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
