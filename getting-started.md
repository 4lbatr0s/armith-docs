# Getting Started

This guide moves you from account activation to your first successful verification. Choose the integration path that fits your stack.

## 1) Prerequisites

Before calling Armith APIs, ensure you have:

- An active Armith account (Clerk sign-in on the dashboard)
- Dashboard access for your team member
- An API key created under **Integrations → API Keys** (not Profile)
- Your API base URL (see [Overview](/))
- A backend or secure server that can send `x-api-key` headers

## 2) Choose Your Integration Path

| Path | Integration effort | Best for |
|------|-------------------|----------|
| **Direct REST API** | Medium — you build the upload UI | Custom frontends, server-side flows |
| **Hosted Capture Pages** | Low — redirect-based flow | Web apps, quick integration |
| **Mobile SDK** | Low — native React Native SDK | React Native mobile apps |

### Direct REST API

You build the capture UI, upload images via presigned URLs, and call verification endpoints:

- [Step-by-Step API Flow](/kyc-api-flow)
- [Authentication](/authentication)

### Hosted Capture Pages

Armith handles the capture UI. You create a session and redirect the end-user:

- [Integrator Hosted Flow](/integrator-hosted-flow)

### Mobile SDK

Integrate the native React Native SDK for in-app capture:

- [Mobile SDK](/mobile-sdk)

## 3) Choose Environment

Use one base URL per environment.

### Sandbox / shared backend

`https://armith-backend-live.onrender.com`

### Production

`https://api.armith.com` (when provisioned for your tenant)

Local development typically runs the backend at `http://localhost:3001` and the dashboard at `http://localhost:3000`.

## 4) Authentication Model

KYC endpoints accept **one of**:

| Mode | When to use |
|------|-------------|
| **API key** | Server-to-server integrations (recommended for production) |
| **Clerk session JWT** | Dashboard and same-origin SPA calls |
| **Capture session token** | Embedded end-user capture flows (`X-Verification-Session` header) |

**Public endpoints (no auth):**

- `GET /health`
- `GET /health/ready`
- `GET /kyc/countries`
- `GET /kyc/llm-status`
- `GET /config/presets`

**Protected KYC examples:**

- `POST /kyc/upload-url`
- `POST /kyc/secure-download-url`
- `POST /kyc/id-check`
- `POST /kyc/selfie-check`
- `POST /kyc/eid-check`
- `GET /kyc/status/:profileId`
- `GET /kyc/sessions/:id`

**Dashboard-only (Clerk session required):**

- All `/admin/*` routes
- `GET /config`, `PATCH /config`, `POST /config/preset`
- `GET /auth/profile`

## 5) Quick Start — Direct API (5 steps)

```bash
# 1. Health check
curl -sS "https://armith-backend-live.onrender.com/health"

# 2. Check supported countries
curl -sS "https://armith-backend-live.onrender.com/kyc/countries"

# 3. Generate upload URL
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"fileType": "image/jpeg", "documentType": "id-front"}'

# 4. Upload image to the returned uploadUrl
curl -X PUT "<UPLOAD_URL>" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@./id-front.jpg"

# 5. Run ID verification
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "TR", "frontImageUrl": "<DOWNLOAD_URL>"}'
```

## 6) Important Constraints

- **API keys are shown once** at creation; store them securely (see [Authentication](/authentication))
- Image URLs must be reachable by the backend (use Armith upload URLs or tenant-scoped storage keys)
- When both ID and selfie are required, `profileId` is mandatory for the selfie step
- Monthly verification usage is enforced by plan tier (`PLAN_LIMIT_REACHED` on free tier: **20**/month)
- Preflight runs **before** LLM calls — blurry or suspicious images fail fast with `BLURRY_IMAGE` or `ADVERSARIAL_IMAGE_DETECTED`
- Optional `Idempotency-Key` header on `id-check` and `selfie-check` prevents duplicate charges on retries (24h TTL)
- API keys can be restricted by IP CIDR allowlists (account-wide or per-key)

## 7) Next Steps

- [Step-by-Step API Flow](/kyc-api-flow) — full curl sequence
- [Hosted Capture Flow](/integrator-hosted-flow) — redirect-based integration
- [Outbound Webhooks](/webhooks) — event types, signing, verification
- [Verification & Preflight](/verification-and-preflight) — blur thresholds and quality gates
