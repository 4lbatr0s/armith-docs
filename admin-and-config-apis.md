# Admin and Config APIs

Dashboard and automation endpoints beyond the core KYC upload/verify flow. All `/admin/*` routes require **Clerk session** authentication (`requireAuth()`).

Base URL: same as KYC API (e.g. `https://armith-backend-live.onrender.com`).

## Admin — Verifications

### List verifications

`GET /admin/verifications?page=1&limit=10&status=APPROVED`

Query:

| Param | Description |
|-------|-------------|
| `page` | Page number (default 1) |
| `limit` | Page size (max 100) |
| `status` | Filter: `APPROVED`, `REJECTED`, `PENDING`, `UNDER_REVIEW`, `FAILED` |

### Delete verification

`DELETE /admin/verifications/:profileId`

Deletes profile and validation records. Optional R2 object purge when `ADMIN_DELETE_PURGE_OBJECTS=1`.

### Capture session token

`POST /admin/verifications/:profileId/capture-session`

Body (optional): `{ "ttlSeconds": 900 }`

Returns `{ token, expiresAtEpochSec, headerName: "X-Verification-Session" }` for embedded capture UIs.

### Dashboard statistics

`GET /admin/stats`

Returns aggregate counts: total, approved, rejected, pending, underReview, approvalRate, activeApiKeys.

### Error summary

`GET /admin/errors/summary?limit=100`

Top error fingerprints for ops/debugging (max limit 400).

## Admin — Manual Review

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/manual-reviews?page=1&limit=10&source=auto` | Review queue |
| `POST` | `/admin/manual-reviews/:profileId/enqueue` | Enqueue PENDING profile |
| `POST` | `/admin/manual-reviews/:profileId/resolve` | Body: `{ "decision": "APPROVED" \| "REJECTED", "note?": "…" }` |

## Admin — Settings

Product-shaped tenant configuration (primary dashboard path).

### Get settings

`GET /admin/settings`

```json
{
  "settings": {
    "verificationRules": {
      "requireIdCard": true,
      "requireSelfie": true,
      "logicOperator": "AND",
      "allowPartialSubmission": false
    },
    "thresholds": {
      "fullNameConfidence": 0.8,
      "identityNumberConfidence": 0.9,
      "matchConfidence": 92,
      "idMinCaptureSharpness": 0.38,
      "selfieMinCaptureSharpness": 0.38,
      "idMinImageQuality": 0.62,
      "selfieMinImageQuality": 0.62,
      "minDocumentVitalityConfidence": 0.55,
      "spoofingRiskMax": 0.25
    },
    "integration": {
      "webhookUrl": "",
      "hasWebhookSecret": false,
      "webhookEvents": ["verification.completed", "verification.failed"],
      "webhookDataFields": [],
      "webhookDataFieldCatalog": ["country", "externalRef", "metadata", "…"]
    },
    "metadata": { "lastUpdated": "2026-05-24T…" }
  },
  "defaults": { "thresholds": { "…": "balanced preset" } }
}
```

Webhook secret is **never** returned — only `hasWebhookSecret`.

### Update settings

`PUT /admin/settings`

```json
{
  "verificationRules": { "requireSelfie": true },
  "thresholds": {
    "idMinCaptureSharpness": 0.42,
    "matchConfidence": 94
  },
  "integration": {
    "webhookUrl": "https://example.com/hook",
    "webhookSecret": "legacy-plaintext-secret",
    "webhookEvents": ["verification.completed"],
    "webhookDataFields": ["externalRef"]
  }
}
```

Legacy integration patches fan out to **all production country configs** for the tenant.

### Reset settings

`POST /admin/settings/reset`

Resets TR production config to code defaults (balanced preset baseline).

## Admin — API Keys

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/api-keys` | List keys (metadata only) + `features.perKeyIpAllowlist` |
| `POST` | `/admin/api-keys` | Body: `{ "name": "prod" }` → `{ apiKey, token }` (**token once**) |
| `DELETE` | `/admin/api-keys/:id` | Revoke |
| `PUT` | `/admin/account-api-ip-allowlist` | Body: `{ "allowedCidrs": ["203.0.113.0/24"] }` |
| `PATCH` | `/admin/api-keys/:id` | Per-key IP allowlist (plan-gated) |

Dashboard UI: **Integrations → API Keys**.

## Admin — Webhooks

See [Outbound Webhooks](/webhooks) for full signing and payload documentation.

| Method | Path |
|--------|------|
| `GET/POST` | `/admin/webhooks/signing-key/default` |
| `GET/POST/PATCH/DELETE` | `/admin/webhooks`, `/admin/webhooks/:id` |
| `POST` | `/admin/webhooks/:id/rotate-key` |
| `GET` | `/admin/webhook-deliveries` |
| `POST` | `/admin/webhooks/replay/:profileId` |

Dashboard UI: **Integrations → Webhooks**.

## Config Endpoints (`/config`)

Document-native KYC configuration for advanced automation. **Clerk session only** — not reachable with API key alone.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/config` | Clerk | Full `KycConfiguration`; creates default if missing |
| `GET` | `/config/presets` | **Public** | Preset catalog (`strict`, `balanced`, `lenient`) |
| `PATCH` | `/config` | Clerk | Partial update with **`version`** optimistic locking |
| `POST` | `/config/preset` | Clerk | Body: `{ "preset": "balanced" }` |

### `/config` vs `/admin/settings`

| Surface | Shape | Locking |
|---------|-------|---------|
| `/admin/settings` | Flat `thresholds`, `verificationRules`, `integration` | Bumps `version` on change; no client version required |
| `/config` | Nested Mongo document mirror | `PATCH` requires matching `version`; returns 409 on conflict |

**Recommendation:** Use one writer path per app. Dashboard → `/admin/settings`. Automation with nested fields → `/config`.

`PATCH /config` **rejects** deprecated top-level `integrationWebhook*` fields — use `/admin/webhooks` instead.

## Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/auth/profile` | Clerk | User record, plan, usage |
| `GET` | `/auth/status` | Optional | `{ authenticated, userId }` |
| `POST` | `/auth/webhook` | Svix (Clerk) | Inbound user lifecycle sync |

## Inbound Test Webhook (Debug)

`POST /webhooks/test` — enabled when `WEBHOOK_TEST_ENABLED=1`. Logs payload; optional HMAC check with `WEBHOOK_TEST_SIGNING_SECRET` (plaintext secret style).

Not for production integrations.
