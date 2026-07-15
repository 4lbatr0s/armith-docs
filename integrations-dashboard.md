# Integrations Dashboard

Operational configuration lives in the dashboard at **Integrations** (`/integrations`), not under Profile. Admin settings, manual review, and analytics are under **Admin** (`/admin`).

## Tabs

| Tab | URL | Purpose |
|-----|-----|---------|
| **Webhooks** | `/integrations?tab=webhooks` (default) | Multi-webhook CRUD, signing keys, event subscriptions |
| **API Keys** | `/integrations?tab=api-keys` | Create/revoke keys, IP allowlists |

::: tip
The legacy path `Profile → Security` is **deprecated**. Old `?tab=security` links redirect to Integrations.
:::

## API Keys Tab

### Create a key

1. Open **Integrations → API Keys**
2. Enter a descriptive name (e.g. `production-backend`)
3. Select environment: **Live** (`ak_live_`) for production or **Sandbox** (`ak_test_`) for testing
4. Copy the full token immediately — it is **never shown again**
5. Store in your secret manager; use only from server-side code

### Revoke a key

Delete/revoke from the same tab. Revoked keys return `401 Invalid API key` on KYC routes.

### IP allowlists

- **Account-wide CIDR list** — applies to all keys for the tenant (up to 24 rules)
- **Per-key allowlist** — available on Growth/Enterprise plans (`features.perKeyIpAllowlist`)

Configure via the UI or:

- `PUT /admin/account-api-ip-allowlist`
- `PATCH /admin/api-keys/:id`

## Webhooks Tab

### Account default signing key

Before creating webhooks, mint an **account default signing key** (optional but recommended):

- Shown **once** as a 64-character hex `rawKey`
- Stored server-side as `SHA-256(rawKey)` only
- Reused when creating webhooks with `signingKey.source: account_default`

API: `GET/POST /admin/webhooks/signing-key/default`

### Create a webhook (up to 10 per tenant)

Each webhook has:

| Field | Description |
|-------|-------------|
| `name` | Label for dashboard |
| `url` | HTTPS endpoint (required) |
| `events` | Subscribed event types (empty = all events) |
| `dataFields` | Optional extra payload keys (PII opt-in) |
| `isActive` | Toggle delivery |
| Signing key | Account default, newly generated, or bring-your-own |

See [Outbound Webhooks](/webhooks) for signing verification and payload shapes.

### Delivery monitoring

Webhook delivery status is visible in:

- **Integrations → Webhooks** — last delivery timestamp per webhook
- **Admin → Webhook Deliveries** — full delivery log with filters (`?failedOnly`, `?deadLetter`, `?webhookId`)
- Retry failed deliveries directly from the dashboard or API

### Legacy single-webhook migration

If you configured webhooks before the multi-webhook UI, you may still have:

- `integrationWebhookUrl`
- `integrationWebhookSecret` (plaintext HMAC secret)
- `integrationWebhookEvents` / `integrationWebhookDataFields`

on `KycConfiguration`. These remain active **until you create at least one Webhook document**. After migration, delivery uses the new signing model (`SHA-256(rawKey)` as HMAC key).

Legacy fields can still be updated via `PUT /admin/settings` → `integration` block, but the dashboard recommends creating webhooks in **Integrations → Webhooks**.

## Settings (Admin → Settings)

Verification rules and thresholds are configured under **Admin → Settings** (`/admin?tab=settings`), including:

- **Verification steps** — require ID / selfie, AND/OR logic, partial submission
- **Confidence thresholds** — flat keys like `fullNameConfidence`, `matchConfidence`, `identityNumberConfidence`
- **Capture sharpness** (`idMinCaptureSharpness`, `selfieMinCaptureSharpness`) — Laplacian preflight gate (default **0.38**)
- **Image quality floors** (`idMinImageQuality`, `selfieMinImageQuality`)
- **Age rules** — min/max age, enforcement toggle
- **MRZ confidence** — minimum MRZ read confidence
- **Document vitality** — minimum document liveness score
- **Spoofing/max risk** — maximum acceptable spoofing risk

Advanced nested fields (`minOverallConfidence`, `maxTamperingRisk`, `verificationFeatures`, `validationRules`) are available via `PATCH /config` with optimistic locking.

### Preset configurations

Quickly switch between threshold bundles:

| Preset | Use case |
|--------|----------|
| `strict` | High-security flows (financial onboarding) |
| `balanced` | General purpose (default) |
| `lenient` | Low-risk flows with higher pass rates |

Apply via `POST /config/preset` with body `{ "preset": "balanced" }`.

## Manual Review (Admin → Manual Reviews)

Profiles in `UNDER_REVIEW` status appear in the manual review queue. Reviewers can:

### List reviews

`GET /admin/manual-reviews?page=1&limit=10&source=auto`

Filter by source: `auto` (auto-escalated) or `manual` (admin-enqueued).

### Enqueue a profile

`POST /admin/manual-reviews/:profileId/enqueue`

Body:
```json
{
  "assigneeLabel": "reviewer@example.com",
  "slaDeadlineMinutes": 240
}
```

### Assign or update

`PATCH /admin/manual-reviews/:profileId`

```json
{
  "assigneeLabel": "senior-reviewer@example.com",
  "note": "Escalated per policy"
}
```

### Resolve

`POST /admin/manual-reviews/:profileId/resolve`

```json
{
  "decision": "APPROVED",
  "note": "Document verified manually — hologram present"
}
```

### Audit trail

Every manual review action is recorded in the profile's `manualReviewAuditTrail`:

```json
[
  { "action": "QUEUED", "at": "2026-06-01T10:00:00Z", "actorUserId": "user_abc" },
  { "action": "REASSIGNED", "at": "2026-06-01T11:00:00Z", "actorUserId": "user_def", "assigneeLabel": "reviewer@example.com" },
  { "action": "RESOLVED_APPROVED", "at": "2026-06-01T12:00:00Z", "actorUserId": "user_def" }
]
```

### Auto-escalation rules

Profiles automatically enter `UNDER_REVIEW` when:
- Warning count ≥ `maxWarningCount` (default 3)
- Composite `riskScore` > `riskScoreCeiling` (default 55)
- Borderline confidence or spoofing bands (`verificationFeatures`)

Webhook: `verification.manual_review_queued` fires on escalation.

## Capture Sessions

For hosted capture flows, mint a short-lived token from the verification detail view or:

`POST /admin/verifications/:profileId/capture-session`

Returns:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs…",
  "expiresAtEpochSec": 1750000000,
  "headerName": "X-Verification-Session"
}
```

The token is write-scoped for the capture UI and read-only for status polling. See [Integrator Hosted Flow](/integrator-hosted-flow).

## Verification List (Admin → Verifications)

Browse, filter, and inspect all KYC profiles for your tenant:

- **List:** `GET /admin/verifications?page=1&limit=10&status=APPROVED&country=TR`
- **Detail:** `GET /admin/verifications/:profileId` — full verification with images, thresholds, evidence
- **Events:** `GET /admin/verifications/:profileId/events` — timeline of lifecycle events
- **Delete:** `DELETE /admin/verifications/:profileId` — deletes profile, validations, webhook deliveries, and optionally R2 objects
