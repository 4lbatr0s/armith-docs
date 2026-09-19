# Debugging Guide

## 1. Reproduce in Sandbox First

Same flow with `ak_test_` + `sandboxScenario`. If sandbox works but live fails → data/quality issue, not integration bug.

## 2. Trace a Request End-to-End

- Send `X-Correlation-Id: <your-id>` on every call — echoed in responses + webhook payloads.
- Save: `profileId`, `Idempotency-Key`, correlation ID, raw error payload, timestamps.
- Check `GET /kyc/status/:profileId` → `thresholds` (what bars applied), `rejectionReasons`/`errors` (why), `session.lifecycle` (where it stopped).

## 3. Check the Usual Suspects

| Layer | Check |
|-------|-------|
| Auth | Key prefix, revocation, Clerk-vs-API-key endpoint mismatch, IP allowlist |
| URLs | Upload URL expired (>300 s)? Wrong `downloadUrl`? Tenant-scoped key? |
| Images | ≤10 MB, JPEG/PNG/WebP, ≥1 MP, sharp, face centered |
| Flow | `id-check` before `selfie-check`? `profileId` threaded through? Country supported? |
| Quota | `429 PLAN_LIMIT_REACHED`? |
| Video Ident | Product enabled? KYC gate? Agent claimed? ≥3 scored frames? LiveKit configured? |
| Biometrics | Production `GET /health/ready` includes `biometrics`? `REQUIRE_VENDOR_BIOMETRICS=1`? |
| Webhooks | Signature (raw bytes, skew ≤300 s), 2xx fast response, delivery log `?failedOnly` |
| Async | Polling terminal status before minting result code? Queue health at `/ops/queues`? |

## 4. Escalate with Evidence

Include: correlation ID, `profileId`, request/response bodies (redact keys), `Idempotency-Key`, webhook delivery `id` + timestamp, sandbox repro steps. Never send raw API keys or PII in chat/email — use redacted logs.