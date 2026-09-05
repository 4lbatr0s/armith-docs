# Webhooks — Get Started

Get real-time verification results instead of polling. Armith sends HTTPS POST on terminal and review events.

---

## Events

| Event | Fires when |
|-------|------------|
| `verification.completed` | Terminal success (`APPROVED`) |
| `verification.failed` | Terminal failure (`REJECTED`, `FAILED`) |
| `verification.manual_review_queued` | Escalated to `UNDER_REVIEW` |
| `verification.manual_review_resolved` | Reviewer decided `APPROVED` / `REJECTED` |

Subscribe to all (default) or pick a subset per webhook.

---

## Step 1: Mint a Signing Key (Once)

**Dashboard → Integrations → Webhooks** → create an account default key. Shown **once** as 64-char hex `rawKey` — store in your secrets manager.

Or via API (`Authorization: Bearer <CLERK_JWT>`):
```bash
curl -X POST "https://armith-backend-live.onrender.com/admin/webhooks/signing-key/default" \
  -H "Authorization: Bearer $CLERK_JWT"
```

---

## Step 2: Create a Webhook (Up to 10 per Tenant)

Dashboard **or**:
```bash
curl -X POST "https://armith-backend-live.onrender.com/admin/webhooks" \
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

| `signingKey.source` | Behavior |
|---------------------|----------|
| `account_default` | Reuse tenant default key |
| `generate_new` | New key — `rawKey` returned once |
| `bring_your_own` | Supply your own `rawKey` |

Optional `dataFields`: `country`, `idVerificationStatus`, `selfieVerificationStatus`, `verificationAttempts`, `profileCreatedAt`, `profileUpdatedAt`, `externalRef` (from `integrationExternalRef`), `metadata` (from `integrationMetadata`), `email`, `fullName` (**PII — opt-in only**).

---

## Step 3: Verify Signatures (Required)

Each delivery sends:
| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-Webhook-Timestamp` | Unix seconds |
| `X-Webhook-Signature` | `sha256=<hex>` of `HMAC-SHA256(SHA-256(rawKey), "{timestamp}.{rawBody}")` |

```js
const crypto = require('crypto');

function verify(req, rawBody, rawKey) {
  const ts = req.headers['x-webhook-timestamp'];
  const sig = req.headers['x-webhook-signature'];
  if (!ts || !sig?.startsWith('sha256=')) return false;
  if (Math.abs(Date.now()/1000 - Number(ts)) > 300) return false; // replay protection

  const derived = crypto.createHash('sha256').update(rawKey).digest('hex');
  const expected = crypto.createHmac('sha256', derived).update(`${ts}.${rawBody}`).digest('hex');
  const received = sig.slice('sha256='.length);
  return expected.length === received.length &&
    crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(received,'hex'));
}
// Express: use express.raw({ type: 'application/json' }) to capture rawBody
```

> Verify against the **exact received bytes**. Respond `2xx` quickly; do heavy work async. [Full details →](/guides/webhooks/verify-signatures)

---

## Payload Shape

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

`outcomeSemantics`: `FINAL` = terminal, no retry expected · `RETRY_SUGGESTED` = user may re-attempt. Manual-review `resolved` adds `decision` + `reviewerNote`.

---

## Retries & Monitoring

- Automatic retries (default 5, max 10 via `WEBHOOK_DELIVERY_MAX_ATTEMPTS`), exponential backoff.
- **Admin → Webhook Deliveries**: filter `?failedOnly`, `?deadLetter`, `?webhookId`, `?profileId`.
- Retry: `POST /admin/webhook-deliveries/:id/retry` · Replay: `POST /admin/webhooks/replay/:profileId?webhookId=...&useStoredDelivery=true` · Test: `POST /admin/webhooks/:id/test`.
- Rotate key: `POST /admin/webhooks/:id/rotate-key`.

**Next:** [Verify Signatures & Event Reference →](/guides/webhooks/verify-signatures) · [Sandbox Testing →](/reference/sandbox-testing) · [Troubleshooting →](/troubleshooting/common-errors)