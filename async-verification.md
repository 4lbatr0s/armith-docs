# Async Verification

By default, Armith verification runs **synchronously** — the API response contains the complete verification result. For longer-running verifications or higher throughput, Armith supports **asynchronous processing** using BullMQ (backed by Redis).

## When to Use Async

- Large batches of verifications
- Verifications with multiple LLM calls (two-stage routing, ensemble)
- When you want to decouple request handling from processing
- Integration with hosted capture flows (they use async internally)

## How It Works

```
Client                    Armith API                    BullMQ Worker
  │                           │                              │
  │  POST /kyc/id-check       │                              │
  │  { async: true }          │                              │
  │──────────────────────────►│                              │
  │◄─ 202 Accepted ──────────│                              │
  │  { status: "processing", │                              │
  │    profileId, runId }     │                              │
  │                           │  Enqueue verification job    │
  │                           │─────────────────────────────►│
  │                           │                              │
  │                           │  Process: preflight → LLM    │
  │                           │  → validation → persist      │
  │                           │◄─────────────────────────────│
  │                           │                              │
  │  GET /kyc/status/:id      │  Webhook: completed/failed   │
  │──────────────────────────►│◄─────────────────────────────│
  │◄─ { status: "APPROVED" }─│                              │
```

## API

Add `"async": true` to any verification request:

### ID check (async)

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "https://...id-front.jpeg",
    "async": true
  }'
```

### Response (202 Accepted)

```json
{
  "status": "processing",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "runId": "e7b8c9d0-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
}
```

### Selfie check (async)

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/selfie-check" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "idPhotoUrl": "https://...id-front.jpeg",
    "selfieUrls": ["https://...selfie.jpeg"],
    "profileId": "<PROFILE_ID>",
    "async": true
  }'
```

## Checking Results

### Poll status endpoint

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyc/status/<PROFILE_ID>" \
  -H "x-api-key: ak_live_<YOUR_KEY>"
```

### Wait for webhook

Subscribe to `verification.completed` or `verification.failed` events for real-time delivery.

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Job queue** | BullMQ (Redis) | Message broker for async jobs |
| **Worker** | Node.js worker process | Processes verification jobs from the queue |
| **Outbox table** | MongoDB `outboxevents` | Persists pending verification events |
| **Dashboard** | Bull Board (`/ops/queues`) | Queue monitoring UI |

### Queue structure

- **Verification queue** — ID check, selfie check, eID NFC check jobs
- **Webhook queue** — Outbound webhook delivery jobs (separate worker)

### Worker lifecycle

1. Worker picks up pending `outboxevents` documents
2. Marks status as `dispatched`
3. Executes verification pipeline (preflight → LLM → validation → persist)
4. On success: marks as `processed`, emits webhook
5. On failure: marks as `failed`, retries with backoff (configurable)

## Bull Board Dashboard

When `REDIS_URL` is configured, the Bull Board UI is available at `/ops/queues`. This provides:

- Real-time queue status (waiting, active, completed, failed)
- Job details and error messages
- Manual job retry
- Job removal

## Retry Behavior

| Scenario | Behavior |
|----------|----------|
| LLM timeout | 3 retries with exponential backoff |
| Network error | 3 retries with exponential backoff |
| Validation failure | Immediate `failed` — no retry |
| Preflight failure | Immediate `failed` — no retry |

## Best Practices

1. **Always set an `Idempotency-Key`** — prevents duplicate processing if the initial request times out
2. **Use webhooks** as the primary result delivery mechanism — poll status as fallback
3. **Monitor the Bull Board** for queue health in production
4. **Set appropriate timeouts** for your use case (the default is 20 seconds for sync, async has no hard timeout)
