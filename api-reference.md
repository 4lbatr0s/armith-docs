---
outline: deep
---

# REST API Reference

Quick endpoint scanning, auth expectations, and a live request runner.

<div class="armith-api-hero">
  <div>
    <p class="armith-api-hero-title">Base URLs</p>
    <code>Sandbox: https://armith-backend-live.onrender.com</code><br />
    <code>Production: https://api.armith.com</code>
  </div>
  <div>
    <p class="armith-api-hero-title">Spec</p>
    <a href="/openapi.yaml">OpenAPI YAML</a>
  </div>
</div>

## Endpoint index

<div class="armith-api-grid">
  <a class="armith-api-card" href="#health--auth">
    <span class="armith-api-card-title">Health & Auth</span>
    <span class="armith-api-card-desc">Liveness, session profile, Clerk status.</span>
  </a>
  <a class="armith-api-card" href="#kyc-operations">
    <span class="armith-api-card-title">KYC operations</span>
    <span class="armith-api-card-desc">Upload, verify, status, secure download, idempotency.</span>
  </a>
  <a class="armith-api-card" href="#admin--config">
    <span class="armith-api-card-title">Admin & Config</span>
    <span class="armith-api-card-desc">Settings, webhooks, API keys, manual review, config CRUD.</span>
  </a>
</div>

## Authentication modes

| Mode | Headers | Used for |
|------|---------|----------|
| **None** | — | `/health`, `/kyc/countries`, `/kyc/llm-status`, `GET /config/presets` |
| **API key** | `x-api-key: ak_live_…` or `Authorization: Bearer ak_live_…` | `/kyc/*` protected routes |
| **Clerk JWT** | `Authorization: Bearer <session JWT>` | `/auth/profile`, `/admin/*`, `/config` |
| **Capture session** | `X-Verification-Session: <token>` | `/kyc/*` for embedded capture flows |

Optional on KYC writes: `Idempotency-Key: <unique>` (24h deduplication).

::: tip
Paste a dashboard JWT from browser devtools (Network → Authorization header). For production integrations, use `x-api-key` from **Integrations → API Keys**.
:::

## Health & Auth

### <span class="armith-method armith-method-get">GET</span> `/health`
Liveness probe with service metadata.

### <span class="armith-method armith-method-get">GET</span> `/auth/status`
Clerk session probe.

### <span class="armith-method armith-method-get">GET</span> `/auth/profile`
Dashboard user profile and plan usage. Clerk JWT only.

## KYC operations

### <span class="armith-method armith-method-post">POST</span> `/kyc/upload-url`
Presigned upload URL for `id-front`, `id-back`, or `selfie`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/secure-download-url`
Short-lived download URL for tenant-owned storage keys.

### <span class="armith-method armith-method-post">POST</span> `/kyc/id-check`
ID extraction + validation. Preflight blur/adversarial gates. Optional `integrationExternalRef`, `integrationMetadata`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/selfie-check`
Face match + liveness checks. Requires `profileId` when both ID and selfie are mandatory.

### <span class="armith-method armith-method-get">GET</span> `/kyc/status/:profileId`
Combined verification progress and checkpoint results (uppercase profile status).

### <span class="armith-method armith-method-get">GET</span> `/kyc/sessions/:id`
Alias for status endpoint (same handler).

## Admin & Config

### Webhooks
`GET/POST /admin/webhooks`, signing keys, deliveries, replay — see [Outbound Webhooks](/webhooks).

### Settings
`GET/PUT /admin/settings`, `POST /admin/settings/reset` — flat thresholds including `idMinCaptureSharpness`.

### API keys & IP allowlists
`GET/POST/DELETE /admin/api-keys`, `PUT /admin/account-api-ip-allowlist`.

### Manual review
`GET /admin/manual-reviews`, resolve/enqueue endpoints.

### Config CRUD
`GET/PATCH /config`, `GET /config/presets`, `POST /config/preset`.

---

## Live API Playground

Use the interactive explorer below to test requests and inspect sample + live responses.

::: warning
Browsers enforce CORS. The backend must allow this docs origin and `x-api-key` in preflight headers.
:::

<RestApiPlayground />
