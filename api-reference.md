---
outline: deep
---

# REST API Reference

<span class="armith-kicker">Reference</span>

This page is designed to feel closer to modern API docs (Notion/Stripe style): quick endpoint scanning, clear auth expectations, and a live request runner in the same flow.

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
    <span class="armith-api-card-desc">Liveness checks and current session identity.</span>
  </a>
  <a class="armith-api-card" href="#kyc-operations">
    <span class="armith-api-card-title">KYC operations</span>
    <span class="armith-api-card-desc">Upload URL, ID verification, selfie verification, status lookup.</span>
  </a>
  <a class="armith-api-card" href="#admin--config">
    <span class="armith-api-card-title">Admin & Config</span>
    <span class="armith-api-card-desc">Dashboard-level management and programmable KYC settings.</span>
  </a>
</div>

## Authentication modes

| Mode | Headers | Used for |
|------|---------|-----------|
| **None** | — | `/health`, public KYC metadata |
| **API key + optional Clerk** | `x-api-key: ak_live_…` **or** `Authorization: Bearer ak_live_…` | `/kyc/*` protected routes |
| **Clerk JWT** | `Authorization: Bearer <dashboard session JWT>` | `/auth/profile`, `/admin/*`, `/config` (except `GET /config/presets`) |

::: tip
Paste a dashboard JWT from browser devtools (`Fetch/XHR` Authorization header).  
For backend integrations, prefer `x-api-key`.
:::

## Health & Auth

### <span class="armith-method armith-method-get">GET</span> `/health`
Liveness probe with service metadata.

### <span class="armith-method armith-method-get">GET</span> `/auth/status`
Returns whether current request is authenticated by Clerk.

### <span class="armith-method armith-method-get">GET</span> `/auth/profile`
Returns the dashboard user profile and plan usage. Requires Clerk JWT.

## KYC operations

### <span class="armith-method armith-method-post">POST</span> `/kyc/upload-url`
Create a pre-signed upload URL for ID/selfie media.

### <span class="armith-method armith-method-post">POST</span> `/kyc/id-check`
Run ID extraction + document quality checks.

### <span class="armith-method armith-method-post">POST</span> `/kyc/selfie-check`
Run selfie + face match checks.

### <span class="armith-method armith-method-get">GET</span> `/kyc/status/:profileId`
Fetch combined verification progress and checkpoint results.

## Admin & Config

### <span class="armith-method armith-method-get">GET</span> `/admin/*`
Dashboard reporting and operational endpoints (Clerk JWT).

### <span class="armith-method armith-method-patch">PATCH</span> `/config`
Programmatic tenant KYC configuration updates.

### <span class="armith-method armith-method-get">GET</span> `/config/presets`
Public preset list (no authentication).

---

## Live API Playground

Use the interactive explorer below to test requests and inspect sample + live responses.

::: warning
Browsers enforce CORS. The backend must allow this docs origin (`Access-Control-Allow-Origin`) and `x-api-key` in preflight headers.
:::

<RestApiPlayground />
