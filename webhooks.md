# Outbound Webhooks

Armith delivers **HTTPS POST** notifications when verification lifecycle events occur. Configure webhooks in the dashboard under **Integrations → Webhooks** or via `/admin/webhooks` APIs.

## Event Types

| Event | Trigger |
|-------|---------|
| `verification.completed` | Terminal success (`APPROVED`) |
| `verification.failed` | Terminal failure (`REJECTED`, `FAILED`) |
| `verification.manual_review_queued` | Profile escalated to `UNDER_REVIEW` |
| `verification.manual_review_resolved` | Manual review cleared with a decision |

### Subscription semantics

**Multi-webhook model (`Webhook` documents):**

- `events: []` or omitted → subscribe to **all** event types
- Explicit list → only listed events delivered

**Legacy single-webhook (`KycConfiguration` integration fields):**

- `integrationWebhookEvents` absent → all events
- Empty array → **disable all** deliveries

## Delivery Resolution Order

1. If tenant has **any active `Webhook` documents** → fan-out to matching active webhooks
2. Else → **legacy fallback** to single `integrationWebhookUrl` + `integrationWebhookSecret`

Once ≥1 Webhook document exists, legacy integration secret is **not used for delivery**.

## HTTP Request Format

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-Webhook-Timestamp` | Unix seconds (string) |
| `X-Webhook-Signature` | `sha256=<hex>` |

Body is JSON. The server injects top-level `id` (delivery UUID) immediately before signing — verify using the **exact received bytes**.

Reject deliveries when `|now - timestamp| > 300` seconds (replay protection).

Retries: configurable (default 3 attempts, exponential backoff). Logged in `WebhookDelivery` collection.

## Payload Shape (`apiVersion: 2026-05-06`)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "verification.completed",
  "created": "2026-05-24T12:00:00.000Z",
  "apiVersion": "2026-05-06",
  "data": {
    "profileId": "672a9c2e3f1b2c4d5e6f7890",
    "sessionId": "672a9c2e3f1b2c4d5e6f7890",
    "status": "APPROVED",
    "correlationId": "corr-abc",
    "outcomeSemantics": "FINAL"
  }
}
```

### Terminal events (`verification.completed` / `verification.failed`)

| Field | Description |
|-------|-------------|
| `profileId` | MongoDB ObjectId |
| `sessionId` | Same as `profileId` (legacy compat) |
| `status` | Uppercase (`APPROVED`, `REJECTED`, `FAILED`) |
| `correlationId` | Request correlation when available |
| `outcomeSemantics` | `FINAL` or `RETRY_SUGGESTED` |

### Manual review events

**Queued:** `profileId`, `sessionId`, `status` (typically `UNDER_REVIEW`), `correlationId`

**Resolved:** above + `decision` (`APPROVED` | `REJECTED`)

## Optional `data` Fields (Per-Webhook Allowlist)

Enable on each webhook via `dataFields`:

| Token | Description |
|-------|-------------|
| `country` | Profile country code |
| `idVerificationStatus` | ID checkpoint status |
| `selfieVerificationStatus` | Selfie checkpoint status |
| `verificationAttempts` | Attempt counter |
| `profileCreatedAt` / `profileUpdatedAt` | ISO timestamps |
| `email`, `fullName` | **PII** — opt-in only |
| `externalRef` | From API `integrationExternalRef` |
| `metadata` | From API `integrationMetadata` |

Omitted when empty.

## Supplying Context From Verification API

Optional on `POST /kyc/id-check` and `POST /kyc/selfie-check`:

| Field | Limits |
|-------|--------|
| `integrationExternalRef` | string, max 256, trimmed |
| `integrationMetadata` | object, max 20 keys; key ≤64; value ≤512; total JSON ≤4096 bytes |

Persisted on the profile; included in webhooks when enabled.

## Signing Model (Multi-Webhook — Current)

1. Armith mints a 64-character hex **`rawKey`** — shown **once** at create/rotate
2. Server stores `storedHash = SHA-256(rawKey)` only
3. Each delivery signs: `HMAC-SHA256(storedHash, "{timestamp}.{rawBody}")`

### Node.js verification

```js
const crypto = require('crypto');

function verifyArmithWebhook(req, rawBody, rawKey) {
  const ts = req.headers['x-webhook-timestamp'];
  const sig = req.headers['x-webhook-signature'];
  if (!ts || !sig?.startsWith('sha256=')) return false;

  const derivedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  const expected = crypto
    .createHmac('sha256', derivedKey)
    .update(`${ts}.${rawBody}`)
    .digest('hex');

  const received = sig.slice('sha256='.length);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}
```

Use Express `express.raw({ type: 'application/json' })` or equivalent to capture `rawBody`.

### Signing key sources at webhook create

| Source | Behavior |
|--------|----------|
| `account_default` | Reuses tenant default key (`User.webhookDefaultSigningKeyHash`) |
| `generate_new` | New raw key; returned once in create response |
| `bring_your_own` | Supply your own `rawKey` |

Rotate: `POST /admin/webhooks/:id/rotate-key`

## Legacy Signing (Single Webhook)

Tenants without Webhook documents use:

```text
HMAC-SHA256(plaintextSecret, "{timestamp}.{rawBody}")
```

where `plaintextSecret` is `integrationWebhookSecret` on `KycConfiguration`.

**Migrate** by creating a webhook in Integrations → Webhooks.

::: warning Test sink caveat
`POST /webhooks/test` (debug, `WEBHOOK_TEST_ENABLED=1`) verifies with **plaintext secret**, not the derived hash model. Use only for local debugging.
:::

## Webhook Management APIs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/webhooks/signing-key/default` | Default key status `{ hasDefault, hint, mintedAt }` |
| `POST` | `/admin/webhooks/signing-key/default` | Mint account default key (`rawKey` once) |
| `GET` | `/admin/webhooks` | List webhooks (max 10) |
| `POST` | `/admin/webhooks` | Create webhook |
| `PATCH` | `/admin/webhooks/:id` | Update name, url, events, dataFields, isActive |
| `DELETE` | `/admin/webhooks/:id` | Delete |
| `POST` | `/admin/webhooks/:id/rotate-key` | Rotate signing key |
| `GET` | `/admin/webhook-deliveries` | Delivery log (`?failedOnly`, `?webhookId`) |
| `POST` | `/admin/webhooks/replay/:profileId` | Replay terminal webhook (`?webhookId=`, `?useStoredDelivery=true`) |

All require Clerk dashboard authentication.

## Create Webhook Example

```bash
curl -X POST "$BASE_URL/admin/webhooks" \
  -H "Authorization: Bearer $CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production backend",
    "url": "https://api.example.com/armith/webhooks",
    "events": ["verification.completed", "verification.failed"],
    "dataFields": ["country", "externalRef", "metadata"],
    "signingKey": { "source": "generate_new" }
  }'
```

Response includes `rawKey` **once** — store immediately.

## Legacy Settings Integration Block

Still writable via `PUT /admin/settings`:

```json
{
  "integration": {
    "webhookUrl": "https://…",
    "webhookSecret": "…",
    "webhookEvents": ["verification.completed"],
    "webhookDataFields": ["externalRef"]
  }
}
```

`hasWebhookSecret` is returned on GET; secret value is never exposed after save.

Prefer the multi-webhook UI for new integrations.
