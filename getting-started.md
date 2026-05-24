# Getting Started

This guide moves you from account activation to your first successful verification.

## 1) Prerequisites

Before calling Armith APIs, ensure you have:

- An active Armith account (Clerk sign-in on the dashboard)
- Dashboard access for your team member
- An API key created under **Integrations → API Keys** (not Profile)
- Your API base URL (see [Overview](/))
- A backend or secure server that can send `x-api-key` headers
- Ability to `PUT` binary files to pre-signed upload URLs

If you use the dashboard live demo flow, the user must be signed in before verification starts.

## 2) Choose Environment

Use one base URL per environment.

### Sandbox / shared backend

`https://armith-backend-live.onrender.com`

### Production

`https://api.armith.com` (when provisioned for your tenant)

Local development typically runs the backend at `http://localhost:3001` and the dashboard at `http://localhost:3000`.

## 3) Authentication Model

KYC endpoints accept **one of**:

| Mode | When to use |
|------|-------------|
| **API key** | Server-to-server integrations (recommended for production) |
| **Clerk session JWT** | Dashboard and same-origin SPA calls |
| **Capture session token** | Embedded end-user capture flows (`X-Verification-Session` header) |

**Public endpoints (no auth):**

- `GET /health`
- `GET /kyc/countries`
- `GET /kyc/llm-status`
- `GET /config/presets`

**Protected KYC examples:**

- `POST /kyc/upload-url`
- `POST /kyc/secure-download-url`
- `POST /kyc/id-check`
- `POST /kyc/selfie-check`
- `GET /kyc/status/:profileId`
- `GET /kyc/sessions/:id` (alias for status)

**Dashboard-only (Clerk session required):**

- All `/admin/*` routes
- `GET /config`, `PATCH /config`, `POST /config/preset`
- `GET /auth/profile`

## 4) Minimal Integration Checklist

1. Sign in to the dashboard → **Integrations → API Keys**
2. Create an API key; store the raw token in your secret manager (shown **once**)
3. (Optional) **Integrations → Webhooks** — register HTTPS endpoint and save the signing key
4. Call `POST /kyc/upload-url` for each required file (`id-front`, `id-back`, `selfie`)
5. `PUT` file bytes to each returned `uploadUrl`
6. Call `POST /kyc/id-check` with `downloadUrl` values
7. Call `POST /kyc/selfie-check` with `profileId` when both ID and selfie are required
8. Call `GET /kyc/status/:profileId` for consolidated state (or rely on webhooks)

## 5) First Health Checks

```bash
curl -sS "https://armith-backend-live.onrender.com/health"
curl -sS "https://armith-backend-live.onrender.com/kyc/countries"
```

## 6) Important Constraints

- **API-first:** no official client SDK at this stage
- API keys are shown once at creation; store them securely
- Image URLs must be reachable by the backend (use Armith upload URLs or tenant-scoped storage keys)
- When both ID and selfie are required, `profileId` is mandatory for the selfie step
- Monthly verification usage is enforced by plan tier (`PLAN_LIMIT_REACHED` on free tier: **20**/month)
- Preflight runs **before** LLM calls — blurry or suspicious images fail fast with `BLURRY_IMAGE` or `ADVERSARIAL_IMAGE_DETECTED`
- Optional `Idempotency-Key` header on `id-check` and `selfie-check` prevents duplicate charges on retries (24h TTL)

## 7) Next Steps

- [Step-by-Step API Flow](/kyc-api-flow) — copy-paste curl sequence
- [Outbound Webhooks](/webhooks) — event types, signing, verification
- [Verification & Preflight](/verification-and-preflight) — blur thresholds and quality gates
