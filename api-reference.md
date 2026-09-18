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
  <a class="armith-api-card" href="#health--ops">
    <span class="armith-api-card-title">Health & Ops</span>
    <span class="armith-api-card-desc">Liveness, readiness, Prometheus metrics, SLO, queue UI.</span>
  </a>
  <a class="armith-api-card" href="#auth">
    <span class="armith-api-card-title">Auth</span>
    <span class="armith-api-card-desc">Session profile, Clerk webhook, status.</span>
  </a>
  <a class="armith-api-card" href="#kyc-operations">
    <span class="armith-api-card-title">KYC operations</span>
    <span class="armith-api-card-desc">Upload, verify (ID/selfie/eID NFC), status, secure download, idempotency.</span>
  </a>
  <a class="armith-api-card" href="#integrator-api">
    <span class="armith-api-card-title">Integrator API</span>
    <span class="armith-api-card-desc">Hosted profiles, sessions, result codes — API key only.</span>
  </a>
  <a class="armith-api-card" href="#kyb">
    <span class="armith-api-card-title">KYB</span>
    <span class="armith-api-card-desc">Business verification profiles.</span>
  </a>
  <a class="armith-api-card" href="#admin">
    <span class="armith-api-card-title">Admin</span>
    <span class="armith-api-card-desc">Verifications, settings, webhooks, API keys, manual review, analytics, audit, DSR, workflows.</span>
  </a>
  <a class="armith-api-card" href="#config">
    <span class="armith-api-card-title">Config</span>
    <span class="armith-api-card-desc">Programmable KYC configuration, presets.</span>
  </a>
</div>

## Authentication modes

| Mode | Headers | Used for |
|------|---------|----------|
| **None** | — | `/health`, `/kyc/countries`, `/kyc/llm-status`, `GET /config/presets` |
| **API key** | `x-api-key: ak_live_…` or `Authorization: Bearer ak_live_…` | `/kyc/*` protected routes, `/kyb/*` |
| **Clerk JWT** | `Authorization: Bearer <session JWT>` | `/auth/profile`, `/admin/*`, `/config` |
| **Capture session** | `X-Verification-Session: <token>` | `/kyc/*` for embedded capture flows |

Optional on KYC writes: `Idempotency-Key: <unique>` (24h deduplication).

## Health & Ops

### <span class="armith-method armith-method-get">GET</span> `/health`
Liveness probe with service metadata.

### <span class="armith-method armith-method-get">GET</span> `/health/ready`
Readiness probe — MongoDB, R2, Groq, Redis, and vendor **biometrics** (`GET {PYTHON_BIOMETRICS_URL}/health`). Production fails closed if biometrics are required and missing.

### <span class="armith-method armith-method-get">GET</span> `/metrics`
Prometheus metrics (when `METRICS_ENABLED=1`).

### <span class="armith-method armith-method-get">GET</span> `/ops/slo`
SLO status dashboard.

### <span class="armith-method armith-method-get">GET</span> `/ops/queues`
Bull Board queue monitoring UI (when `REDIS_URL` set).

## Auth

### <span class="armith-method armith-method-get">GET</span> `/auth/status`
Clerk session probe.

### <span class="armith-method armith-method-get">GET</span> `/auth/profile`
Dashboard user profile and plan usage. Clerk JWT only.

### <span class="armith-method armith-method-post">POST</span> `/auth/webhook`
Inbound Clerk user lifecycle webhook (Svix verified).

## KYC operations

### <span class="armith-method armith-method-post">POST</span> `/kyc/upload-url`
Presigned upload URL for `id-front`, `id-back`, or `selfie`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/secure-download-url`
Short-lived download URL for tenant-owned storage keys.

### <span class="armith-method armith-method-post">POST</span> `/kyc/id-check`
ID extraction + validation. Preflight blur/adversarial gates. Optional `integrationExternalRef`, `integrationMetadata`, `async`, `sandboxScenario`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/selfie-check`
Face match + liveness checks. Requires `profileId` when both ID and selfie are mandatory. Supports `async` and `sandboxScenario`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/videocall/session`
Mint a LiveKit applicant token for Video Ident. Requires recording consent (`recordingConsent: true` or prior `POST /kyc/sessions/consent`). Only when Video Ident is enabled (`videocallEnabled`). By default KYC must already be `APPROVED` (`videocallRequiresKycApproved`). A write capture token without a bound profile can mint a PENDING shell only if that gate is **off**. Response includes `profileId`. Does not affect KYC approval.

### <span class="armith-method armith-method-post">POST</span> `/kyc/videocall/heartbeat`
Applicant waiting-room heartbeat. Body `{ "sessionId" }` (required). Returns `frameCount`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/videocall/frame`
Score a live still (`frameImageUrl` or `frameDataUrl`). `sessionId` required.

### <span class="armith-method armith-method-post">POST</span> `/kyc/videocall-check`
Finalize Video Ident scores. Default `decisionMode` is `agent_required` — Groq stills cannot auto-`APPROVE`. Does not change KYC `profile.status`. 409 `VIDEOCALL_NO_AGENT` if no agent claimed and mode ≠ `auto`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/eid-check`
**Preview.** eID NFC chip verification. Chip authenticity is client-attested until server NFC exists — do not treat as production-grade.

### <span class="armith-method armith-method-get">GET</span> `/kyc/status/:profileId`
Combined verification progress and checkpoint results (uppercase profile status). Includes sibling `videocall` / `videocallVerification`. `progress.isFullyVerified` is ID + selfie + AML only.

### <span class="armith-method armith-method-get">GET</span> `/kyc/sessions/:id`
Alias for status endpoint (same handler).

### <span class="armith-method armith-method-get">GET</span> `/kyc/countries`
Supported country codes.

### <span class="armith-method armith-method-get">GET</span> `/kyc/llm-status`
LLM provider readiness and model info.

## Integrator API

API key only — these endpoints support the hosted capture flow.

### <span class="armith-method armith-method-post">POST</span> `/kyc/profiles`
Create KYC profile + mint hosted capture redirect URL (v2 write token). API key only. Optional `workflowId`. `ttlSeconds` default **900**.

### <span class="armith-method armith-method-post">POST</span> `/kyc/hosted-sessions`
One-shot hosted web capture session (defaults to `channel: web`). API key only.

### <span class="armith-method armith-method-post">POST</span> `/kyc/profiles/:profileId/sessions`
Mint additional capture session for existing profile. API key only.

### <span class="armith-method armith-method-post">POST</span> `/kyc/sessions/consent`
Record capture consent. Write capture token only. Body `{ "purpose" }` (default `identity_verification`). 200 `{ ok, consentCapturedAt, consentPurpose }`.

### <span class="armith-method armith-method-post">POST</span> `/kyc/sessions/complete`
Exchange result `code` (+ optional `state`). Returns `{ profileId, status` (lowercase), `integrationExternalRef }`. Full scores: webhook or `GET /kyc/status`. API key only.

### <span class="armith-method armith-method-post">POST</span> `/kyc/sessions/result-code`
Mint a result code during capture flow. Write capture session auth. 409 `RESULT_CODE_NOT_READY` until terminal; 503 `RESULT_CODE_STORE_UNAVAILABLE` without Redis in production. Default TTL 900s.

## KYB

**Preview.** Manual legal-entity records only. Automated business-document verification is not production-ready.

### <span class="armith-method armith-method-get">GET</span> `/kyb/profiles`
List KYB profiles. API key.

### <span class="armith-method armith-method-post">POST</span> `/kyb/profiles`
Create KYB profile. API key.

### <span class="armith-method armith-method-get">GET</span> `/kyb/profiles/:id`
Get single KYB profile. API key.

### <span class="armith-method armith-method-get">GET</span> `/kyb/admin/profiles`
List KYB profiles. Clerk auth.

### <span class="armith-method armith-method-post">POST</span> `/kyb/admin/profiles`
Create KYB profile. Clerk auth.

### <span class="armith-method armith-method-get">GET</span> `/kyb/admin/profiles/:id`
Get single KYB profile. Clerk auth.

## Admin

All require Clerk session authentication.

### Verifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/verifications` | Paginated list with filters (status, country, date) |
| `GET` | `/admin/verifications/:profileId` | Full verification detail |
| `GET` | `/admin/verifications/:profileId/events` | Timeline of lifecycle events |
| `DELETE` | `/admin/verifications/:profileId` | Delete profile and artifacts |
| `POST` | `/admin/verifications/:profileId/capture-session` | Mint **v1 read-only** status token (`X-Verification-Session`). Not a `/w/start` / `/m/start` write link. |

### Video Ident desk

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/admin/videocall/:profileId/invite` | Mint `/v/start` write token |
| `GET` | `/admin/videocall/queue` | Waiting + in-call rooms (max 50) |
| `POST` | `/admin/videocall/:id/claim` | Atomic claim. 409 `VIDEOCALL_ALREADY_CLAIMED` |
| `POST` | `/admin/videocall/:id/disposition` | `{ disposition: "approved" \| "rejected", notes? }` |
| `GET` | `/admin/videocall/:id/recording` | Signed R2 URL (1h) |

### Stats & Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/stats` | Aggregate counts and approval rate |
| `GET` | `/admin/account/usage` | Plan-level usage details |
| `GET` | `/admin/analytics` | Funnel, status breakdown, webhook stats |
| `GET` | `/admin/errors/summary` | Top error fingerprints |

### Manual Review

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/manual-reviews` | Review queue |
| `POST` | `/admin/manual-reviews/:id/enqueue` | Enqueue for review |
| `POST` | `/admin/manual-reviews/:id/resolve` | Resolve with decision |
| `PATCH` | `/admin/manual-reviews/:id` | Update assignee/note |

### Settings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/settings` | Get current settings |
| `PUT` | `/admin/settings` | Update settings |
| `POST` | `/admin/settings/reset` | Reset to defaults |
| `GET` | `/admin/settings/history` | Config revision history |

### API Keys

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/api-keys` | List keys |
| `POST` | `/admin/api-keys` | Create key |
| `DELETE` | `/admin/api-keys/:id` | Revoke key |
| `PATCH` | `/admin/api-keys/:id` | Update key (IP allowlist) |
| `PUT` | `/admin/account-api-ip-allowlist` | Set account-wide IP allowlist |

### Webhooks

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/admin/webhooks/signing-key/default` | Default signing key |
| `GET/POST/PATCH/DELETE` | `/admin/webhooks`, `/:id` | Webhook CRUD |
| `POST` | `/admin/webhooks/:id/rotate-key` | Rotate signing key |
| `POST` | `/admin/webhooks/:id/test` | Send test payload |
| `GET` | `/admin/webhook-deliveries` | Delivery log |
| `POST` | `/admin/webhook-deliveries/:id/retry` | Retry delivery |
| `POST` | `/admin/webhooks/replay/:profileId` | Replay terminal webhook |

### Audit & Compliance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/audit-log` | Admin audit events |
| `GET` | `/admin/data-subject/:profileId/export` | GDPR data export |
| `DELETE` | `/admin/data-subject/:profileId` | GDPR data deletion |

### Workflows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/workflows` | List workflows |
| `PUT` | `/admin/workflows` | Create/update workflow |

## Config

### <span class="armith-method armith-method-get">GET</span> `/config`
Full KycConfiguration document. Clerk JWT only.

### <span class="armith-method armith-method-get">GET</span> `/config/presets`
Public list of named threshold bundles.

### <span class="armith-method armith-method-patch">PATCH</span> `/config`
Partial update with `version` optimistic locking.

### <span class="armith-method armith-method-post">POST</span> `/config/preset`
Apply a named preset configuration.

## Inbound Test Webhook

### <span class="armith-method armith-method-post">POST</span> `/webhooks/test`
Debug webhook test sink. Requires `WEBHOOK_TEST_ENABLED=1`.

---

## Live API Playground

Use the interactive explorer below to test requests and inspect sample + live responses.

::: warning
Browsers enforce CORS. The backend must allow this docs origin and `x-api-key` in preflight headers.
:::

<RestApiPlayground />
