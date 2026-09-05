# Webhooks — Verify Signatures & Event Reference

## Signature Model

1. Armith mints a 64-char hex `rawKey` (shown once). Server stores `SHA-256(rawKey)` only.
2. Per delivery: `signature = HMAC-SHA256(storedHash, "{timestamp}.{rawBody}")`, sent as `X-Webhook-Signature: sha256=<hex>`.

### Node.js (Express)

```js
const crypto = require('crypto');
const express = require('express');
const app = express();

// Capture raw bytes BEFORE JSON parsing
app.post('/armith/webhooks',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const rawBody = req.body.toString('utf8');
    if (!verifyArmithWebhook(req, rawBody, process.env.ARMITH_WEBHOOK_RAW_KEY)) {
      return res.status(401).send('bad signature');
    }
    const event = JSON.parse(rawBody);
    // enqueue async work, respond fast
    queue.add(event);
    res.status(200).send('ok');
  });

function verifyArmithWebhook(req, rawBody, rawKey) {
  const ts = req.headers['x-webhook-timestamp'];
  const sig = req.headers['x-webhook-signature'];
  if (!ts || !sig?.startsWith('sha256=')) return false;
  if (Math.abs(Date.now()/1000 - Number(ts)) > 300) return false;
  const derived = crypto.createHash('sha256').update(rawKey).digest('hex');
  const expected = crypto.createHmac('sha256', derived).update(`${ts}.${rawBody}`).digest('hex');
  const received = sig.slice(7);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected,'hex'), Buffer.from(received,'hex'));
}
```

### Python (Flask)

```python
import hmac, hashlib, time
from flask import request

def verify(raw_body: bytes, raw_key: str) -> bool:
    ts = request.headers.get('X-Webhook-Timestamp', '')
    sig = request.headers.get('X-Webhook-Signature', '')
    if not ts or not sig.startswith('sha256='): return False
    if abs(time.time() - int(ts)) > 300: return False
    derived = hashlib.sha256(raw_key.encode()).hexdigest()
    expected = hmac.new(derived.encode(), f"{ts}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig[len('sha256='):])
```

---

## Event Reference

| Event | `data` fields |
|-------|---------------|
| `verification.completed` | `profileId`, `sessionId` (= profileId), `status: APPROVED`, `correlationId`, `outcomeSemantics` |
| `verification.failed` | Same, `status: REJECTED`/`FAILED` |
| `verification.manual_review_queued` | `profileId`, `sessionId`, `status: UNDER_REVIEW`, `correlationId` |
| `verification.manual_review_resolved` | Above + `decision: APPROVED`/`REJECTED`, `reviewerNote?` |

Optional per-webhook `dataFields` (allowlist): `country`, `idVerificationStatus`, `selfieVerificationStatus`, `verificationAttempts`, `profileCreatedAt`, `profileUpdatedAt`, `externalRef`, `metadata`, `email`, `fullName` (PII opt-in). Omitted when empty.

Pass `integrationExternalRef` / `integrationMetadata` on `id-check` / `selfie-check` to have them echoed when enabled (limits: ref ≤256 chars; metadata ≤20 keys, key ≤64, value ≤512, total ≤4 KB).

---

## Retry & Replay

| API (Clerk JWT) | Purpose |
|-----------------|---------|
| `GET /admin/webhook-deliveries?failedOnly=true&webhookId=...&profileId=...` | Delivery log |
| `POST /admin/webhook-deliveries/:id/retry` | Retry failed delivery |
| `POST /admin/webhooks/replay/:profileId?webhookId=...&useStoredDelivery=true` | Replay terminal webhook (stored vs fresh payload) |
| `POST /admin/webhooks/:id/test` | Send test payload |
| `POST /admin/webhooks/:id/rotate-key` | Rotate signing key |

Delivery statuses: `pending` → `delivered` (2xx) / `failed` / `dead_letter` after max attempts.

> Migrating from the legacy single webhook (`integrationWebhookUrl`/`integrationWebhookSecret`)? Creating your first Webhook document switches delivery to the new model. Keep the legacy fields until fan-out is verified, then remove.