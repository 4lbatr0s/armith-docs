# Authentication

Three auth modes. Pick one per request — **never mix**.

---

## 1. API Key (Server-to-Server) — Use This for Production

```
ak_live_<secret>   # production — real LLM, consumes quota
ak_test_<secret>   # sandbox — deterministic fixtures, no quota
```

Send as either header (prefer `x-api-key`):
```http
x-api-key: ak_live_abc123
```
or
```http
Authorization: Bearer ak_live_abc123
```

**Works on:** all `/kyc/*` endpoints + integrator session endpoints (`POST /kyc/profiles`, `/kyc/hosted-sessions`, `/kyc/profiles/:id/sessions`, `/kyc/sessions/complete`). `POST /kyc/sessions/result-code` and `POST /kyc/sessions/consent` require a **write** capture token, not an API key.
**Does NOT work on:** `/admin/*`, `/config` (except public presets), `/auth/profile` — those need Clerk.

**Create:** Dashboard → **Integrations → API Keys** → name it (`prod-backend`), pick environment, copy once, store in secrets manager. **Never ship keys in browser/mobile bundles.**

---

## 2. Clerk Session (Dashboard Only)

```http
Authorization: Bearer <clerk_session_jwt>
```

For `/admin/*` (verifications, webhooks, API keys, manual review, settings), `/config`, `/auth/profile`.

---

## 3. Capture Session Token (Embedded Capture UI)

Your backend mints it, the end-user's browser/app sends it — so you never expose API keys client-side:

```http
X-Verification-Session: <token>
```

Mint **write** tokens from your backend: `POST /kyc/profiles`, `POST /kyc/profiles/:id/sessions`, or `POST /kyc/hosted-sessions` (v2 `scope=capture_write`, `t=` on `/w/start`, `/m/start`, `/v/start`). Dashboard **Mint capture session** (`POST /admin/verifications/:profileId/capture-session`) is **v1 read-only** — poll `GET /kyc/status` only (`403 CAPTURE_SESSION_READ_ONLY` on writes).

Auth priority on KYC routes: capture session → API key → Clerk. **Use API keys from your backend whenever you have a backend.**

---

## Public (No Auth)

`GET /health`, `/health/ready`, `/kyc/countries`, `/kyc/llm-status`, `/config/presets`.

---

## Idempotency (Avoid Double Charges on Retry)

On `POST /kyc/id-check`, `/selfie-check`, `/eid-check`, `/videocall-check`:
```http
Idempotency-Key: id-check-order-123-attempt-1
```
Same key + same body (24h) → cached response + `Idempotent-Replayed: true`. Same key + different body → `409`. In-flight duplicate → `409`.

## Tracing (Optional)

```http
X-Correlation-Id: order-abc-123
```
Max 128 chars, echoed in responses + webhooks. UUID fallback if omitted.

---

## IP Allowlists (Optional)

- **Account-wide** (all keys, up to 24 CIDRs): `PUT /admin/account-api-ip-allowlist` `{"allowedCidrs": [...]}` → violations `403 ACCOUNT_IP_FORBIDDEN`.
- **Per-key** (Growth/Enterprise): `PATCH /admin/api-keys/:id` `{"allowedCidrs": [...]}`. Both layers must pass.

## Fix-It Table

| Symptom | Check |
|---------|-------|
| `401` on KYC route | Key present? Correct prefix (`ak_live_` vs `ak_test_`)? Revoked? |
| `401/403` on `/admin/*` | API keys don't work here — use Clerk JWT |
| `403 ACCOUNT_IP_FORBIDDEN` | Server IP missing from allowlist |
| Keys in frontend bundle | Move to backend, use capture-session tokens client-side |
| Testing burned quota | Use `ak_test_` + `sandboxScenario` |