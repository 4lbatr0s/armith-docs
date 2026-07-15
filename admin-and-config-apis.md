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
| `country` | Filter by country code |
| `search` | Search by name or identity number |
| `dateFrom` / `dateTo` | Date range filter |

### Get verification detail

`GET /admin/verifications/:profileId`

Full verification payload including images, thresholds, checkpoints, screening, and evidence.

### Get verification events

`GET /admin/verifications/:profileId/events`

Paginated timeline of lifecycle events for the profile.

### Delete verification

`DELETE /admin/verifications/:profileId`

Deletes profile, validation records, webhook deliveries, timeline entries, and outbox events. Optional R2 object purge when `ADMIN_DELETE_PURGE_OBJECTS=1`.

### Capture session token

`POST /admin/verifications/:profileId/capture-session`

Body (optional): `{ "ttlSeconds": 900 }`

Returns `{ token, expiresAtEpochSec, headerName: "X-Verification-Session" }` for embedded capture UIs.

## Admin — Dashboard Statistics

### Stats overview

`GET /admin/stats`

Aggregate counts: total, approved, rejected, pending, underReview, approvalRate, activeApiKeys, webhookSuccessRate, topCountries.

### Account usage

`GET /admin/account/usage`

Plan-level usage data: monthly verification count, limit, burst limit, active API keys, plan tier.

### Analytics

`GET /admin/analytics`

Time-window analytics:

| Field | Description |
|-------|-------------|
| `statusBreakdown` | Count by status |
| `funnel` | Total → ID done → Selfie done → Approved |
| `webhookStats` | Delivery success rate (30/90 day periods) |

See [Admin Analytics](/admin-analytics).

## Admin — Manual Review

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/manual-reviews?page=1&limit=10&source=auto` | Review queue |
| `POST` | `/admin/manual-reviews/:profileId/enqueue` | Enqueue PENDING profile (optional: `assigneeLabel`, `slaDeadlineMinutes`) |
| `POST` | `/admin/manual-reviews/:profileId/resolve` | Body: `{ "decision": "APPROVED" \| "REJECTED", "note?": "…" }` |
| `PATCH` | `/admin/manual-reviews/:profileId` | Update assignee, add audit note |

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

### Settings history

`GET /admin/settings/history`

Recent configuration revision snapshots for audit.

## Admin — API Keys

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/api-keys` | List keys (metadata only) + `features.perKeyIpAllowlist` |
| `POST` | `/admin/api-keys` | Body: `{ "name": "prod", "environment": "live" \| "sandbox" }` → `{ apiKey, token }` (**token once**) |
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
| `POST` | `/admin/webhooks/:id/test` |
| `GET` | `/admin/webhook-deliveries` |
| `POST` | `/admin/webhook-deliveries/:deliveryId/retry` |
| `POST` | `/admin/webhooks/replay/:profileId` |

Dashboard UI: **Integrations → Webhooks**.

## Admin — Audit Log

`GET /admin/audit-log`

Cursor-paginated admin audit events with filters:

| Filter | Description |
|--------|-------------|
| `action` | Filter by action type |
| `actorClerkId` | Filter by operator |
| `cursor` | Pagination cursor |

Tracked actions: `settings.update`, `settings.reset`, `api_key.create`, `api_key.revoke`, `api_key.patch`, `verification.delete`, `manual_review.resolve`, `manual_review.enqueue`, `webhook.create`, `webhook.update`, `webhook.delete`, `data_subject.export`, `data_subject.delete`.

## Admin — Data Subject Rights (GDPR)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/data-subject/:profileId/export` | Export all profile data for tenant |
| `DELETE` | `/admin/data-subject/:profileId` | Anonymize/delete profile data (respects `legalHold`) |

See [Data Subject Rights](/data-subject-rights).

## Admin — Workflows

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/workflows` | List verification workflows |
| `PUT` | `/admin/workflows` | Create/update a verification workflow |

See [Verification Workflows](/workflows).

## Admin — Error Summary

`GET /admin/errors/summary?limit=100`

Top 40 structured error/rejection fingerprints across tenant's profiles (max limit 400).

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

## Operations Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe (Mongo, R2, Groq) |
| `GET` | `/metrics` | Prometheus metrics (optional) |
| `GET` | `/ops/slo` | SLO status dashboard |
| `GET/POST` | `/ops/queues` | Bull Board queue UI (when `REDIS_URL` set) |
