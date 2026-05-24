# Integrations Dashboard

Operational configuration lives in the dashboard at **Integrations** (`/integrations`), not under Profile.

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
3. Copy the full `ak_live_…` token immediately — it is **never shown again**
4. Store in your secret manager; use only from server-side code

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

### Legacy single-webhook migration

If you configured webhooks before the multi-webhook UI, you may still have:

- `integrationWebhookUrl`
- `integrationWebhookSecret` (plaintext HMAC secret)
- `integrationWebhookEvents` / `integrationWebhookDataFields`

on `KycConfiguration`. These remain active **until you create at least one Webhook document**. After migration, delivery uses the new signing model (`SHA-256(rawKey)` as HMAC key).

Legacy fields can still be updated via `PUT /admin/settings` → `integration` block, but the dashboard recommends creating webhooks in **Integrations → Webhooks**.

## Settings Tab (Admin)

Verification rules and thresholds are configured under **Admin → Settings** (`/admin?tab=settings`), including:

- Require ID / selfie, AND/OR logic
- Confidence thresholds (flat keys like `fullNameConfidence`, `matchConfidence`)
- **Capture sharpness** (`idMinCaptureSharpness`, `selfieMinCaptureSharpness`) — Laplacian preflight gate (default **0.38**)
- Image quality floors (`idMinImageQuality`, `selfieMinImageQuality`)
- Age rules, MRZ confidence, document vitality, etc.

Advanced nested fields (`minOverallConfidence`, `maxTamperingRisk`, `verificationFeatures`) are available via `PATCH /config` with optimistic locking.

## Manual Review

Profiles in `UNDER_REVIEW` appear in the admin manual review queue:

- `GET /admin/manual-reviews`
- `POST /admin/manual-reviews/:profileId/resolve` with `{ "decision": "APPROVED" | "REJECTED" }`

Webhook events: `verification.manual_review_queued`, `verification.manual_review_resolved`.

## Capture Sessions

For hosted capture flows, mint a short-lived token from the verification detail view or:

`POST /admin/verifications/:profileId/capture-session`

Returns `{ token, expiresAtEpochSec, headerName: "X-Verification-Session" }`.
