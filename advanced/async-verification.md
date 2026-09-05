# Advanced: Async Verification

Default is **synchronous** (result in response, ~2–4 s/checkpoint). Use async for batches, multi-LLM routing, or to decouple request handling from processing. (Hosted capture uses async internally.)

Add `"async": true` to `id-check` / `selfie-check` / `eid-check`:

```bash
curl -X POST "$BASE/kyc/id-check" -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"countryCode": "TR", "frontImageUrl": "https://...jpeg", "async": true}'
# 202 Accepted
{"status": "processing", "profileId": "672a...", "runId": "e7b8..."}
```

Poll `GET /kyc/status/:profileId` or wait for `verification.completed` / `verification.failed` webhook (**recommended**).

**Internals (for ops):** BullMQ + Redis; `outboxevents` collection tracks jobs (`dispatched` → `processed`/`failed` with backoff); validation/preflight failures fail immediately (no retry); monitor at `/ops/queues` (Bull Board, needs `REDIS_URL`).

**Rules:** always send `Idempotency-Key`; webhooks primary, polling fallback; sync timeout ~20 s, async has none.