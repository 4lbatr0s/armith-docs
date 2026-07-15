# Integrator Hosted Flow

Armith provides **hosted capture pages** that handle the entire end-user identity verification flow — ID document capture, selfie capture, preflight checks, and verification — without requiring you to build a capture UI.

This is the recommended integration path for most use cases. Your app redirects the user to Armith's capture page, and Armith redirects them back with the result.

## How It Works

```
Your Backend                     Armith API                    End-User Browser
     │                               │                              │
     │  POST /kyc/profiles            │                              │
     │──────────────────────────────► │                              │
     │◄────────────────────────────── │                              │
     │  { redirectUrl }               │                              │
     │                               │                              │
     │  Redirect user to redirectUrl  │                              │
     │──────────────────────────────────────────────────────────► │
     │                               │                              │
     │                               │  Capture ID + selfie         │
     │                               │◄────────────────────────────►│
     │                               │                              │
     │                               │  Redirect to returnUrl       │
     │                               │  with ?code=<result>         │
     │◄─────────────────────────────────────────────────────────────│
     │                               │                              │
     │  POST /kyc/sessions/complete   │                              │
     │  { code }                     │                              │
     │──────────────────────────────► │                              │
     │◄────────────────────────────── │                              │
     │  { status, profileId }        │                              │
     │                               │                              │
     │  Webhook: verification.completed                              │
     │◄──────────────────────────────│                              │
```

## Step-by-Step Integration

### 1. Create a KYC profile (your backend → Armith)

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "order-12345",
    "countryCode": "TR",
    "channel": "web",
    "integrationMetadata": {
      "sessionType": "new-user-onboarding"
    },
    "returnUrl": "https://yourapp.com/kyc/callback",
    "state": "csrf-token-abc123",
    "ttlSeconds": 3600
  }'
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `integrationExternalRef` | string | yes | Your order/user reference (1–256 chars) |
| `countryCode` | string | no | Country code — defaults to `TR` |
| `channel` | string | no | `mobile` or `web` — defaults to `mobile` |
| `integrationMetadata` | object | no | Max 20 keys, key ≤64, value ≤512, total ≤4096 bytes |
| `returnUrl` | string | yes | Redirect target after completion (1–2048 chars, must match tenant allowlist) |
| `state` | string | yes | Opaque CSRF token echoed in redirect (8–256 chars) |
| `ttlSeconds` | integer | no | Session TTL (60–604800, default 3600) |

#### Response

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "redirectUrl": "https://armith-backend-live.onrender.com/m/start?t=eyJhbGciOiJIUzI1NiIs…",
  "expiresAt": "2026-06-01T13:00:00Z"
}
```

> The `redirectUrl` contains a write-scoped session token as the `t` query parameter. Redirect the user to this URL to start the capture flow.

### 2. Redirect the end-user

Send the user to the `redirectUrl`. Armith's hosted capture page will guide them through:

1. **ID front capture** — camera or file upload
2. **ID back capture** — if required by country
3. **Selfie capture** — if required by tenant configuration
4. **Preflight checks** — blur detection, adversarial scan
5. **Verification** — ID check + selfie check executed server-side
6. **Redirect back** — to your `returnUrl` with result

### 3. Handle the redirect callback

When the flow completes (or is cancelled), Armith redirects the user to your `returnUrl` with query parameters:

**Successful verification:**
```
https://yourapp.com/kyc/callback?code=abc123def456&state=csrf-token-abc123
```

**Cancelled by user:**
```
https://yourapp.com/kyc/callback?error=cancelled&state=csrf-token-abc123
```

**Expired session:**
```
https://yourapp.com/kyc/callback?error=expired&state=csrf-token-abc123
```

### 4. Complete the session (your backend → Armith)

Exchange the `code` for the full verification result:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/sessions/complete" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc123def456",
    "state": "csrf-token-abc123"
  }'
```

#### Response

```json
{
  "status": "APPROVED",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "country": "TR",
  "idVerification": {
    "status": "APPROVED",
    "fullName": "Ada Lovelace",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "overallConfidence": 0.94
  },
  "selfieVerification": {
    "status": "APPROVED",
    "matchConfidence": 96,
    "spoofingRisk": 0.03
  },
  "progress": {
    "idVerification": { "required": true, "completed": true, "approved": true },
    "selfieVerification": { "required": true, "completed": true, "approved": true },
    "isFullyVerified": true
  }
}
```

### 5. (Optional) Receive webhook

Subscribe to `verification.completed` / `verification.failed` events for real-time delivery without polling.

## Minting Additional Sessions

For an existing profile, mint additional capture sessions (e.g., for retry):

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/profiles/:profileId/sessions" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "mobile",
    "returnUrl": "https://yourapp.com/kyc/callback",
    "state": "new-state-token",
    "ttlSeconds": 1800
  }'
```

## One-Shot Hosted Session (Simplified)

For simple web flows without a prior profile:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/hosted-sessions" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "integrationExternalRef": "session-abc",
    "countryCode": "TR",
    "returnUrl": "https://yourapp.com/kyc/callback",
    "state": "csrf-abc"
  }'
```

This is identical to `/kyc/profiles` but defaults `channel` to `web`.

## Session Lifecycle

```
CREATED → CAPTURING → VERIFYING → COMPLETED
    │                        │
    │                        └── EXPIRED (TTL)
    └── CANCELLED (user)
```

## Important Notes

- The `returnUrl` must match one of the allowed URL prefixes configured for your tenant (`kycReturnUrlAllowlist`)
- The `state` parameter is echoed back unchanged — use it for CSRF protection
- Session tokens (`t` parameter) are write-scoped and bound to the specific profile
- Always exchange the `code` server-side — never expose your API key to the client
- Webhook delivery is the most reliable way to get terminal status (built-in retry with exponential backoff)
- You can poll `GET /kyc/status/:profileId` as a fallback
