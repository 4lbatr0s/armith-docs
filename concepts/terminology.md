# Terminology Glossary

Quick reference for Armith-specific terms.

---

## Core Concepts

| Term | Definition |
|------|------------|
| **Profile** | A single applicant record. KYC (ID, selfie, screening) and optional Video Ident attach to the same profile but have separate statuses. Identified by `profileId` (MongoDB ObjectId). |
| **Checkpoint** | A KYC verification step: `id-check`, `selfie-check`, or `eid-check`. Video Ident (`videocall-check`) is a separate product, not a KYC checkpoint. |
| **ProfileId** | The primary key for all API calls. Returned by `id-check` and `POST /kyc/profiles`. |
| **Session** | Sometimes used interchangeably with Profile. In Hosted Capture, a "capture session" is a short-lived token for the UI. |

---

## Status Values

### Checkpoint Status (lowercase, from `id-check`/`selfie-check` response)
| Status | Meaning |
|--------|---------|
| `approved` | This checkpoint passed |
| `pending` | ID passed; selfie (or next step) still required |
| `rejected` | Business/security validation failed |
| `failed` | System/runtime error |

### Profile Status (uppercase, from `GET /kyc/status/:profileId`)
| Status | Meaning |
|--------|---------|
| `APPROVED` | All required checkpoints passed |
| `PENDING` | Awaiting next required step (usually selfie) |
| `REJECTED` | Validation failed |
| `FAILED` | System error |
| `UNDER_REVIEW` | In manual review queue |

### Session Lifecycle (from status endpoint)
| Lifecycle | Meaning |
|-----------|---------|
| `awaiting_id` | Waiting for ID verification |
| `awaiting_selfie` | ID passed; waiting for selfie |
| `awaiting_screening` | Verification done; AML screening in progress |
| `approved` | All checks passed |
| `rejected` | Terminal rejection |
| `failed` | System failure |
| `under_review` | In manual review queue |

---

## Authentication

| Term | Definition |
|------|------------|
| **API Key** | `ak_live_...` or `ak_test_...` — server-to-server auth, send as `x-api-key` header |
| **Clerk Session** | Dashboard user JWT — for admin/config endpoints only |
| **Capture Session Token** | Short-lived token for embedded capture UI — send as `X-Verification-Session` header |
| **Idempotency Key** | Your unique key on write endpoints (`id-check`, `selfie-check`, `eid-check`) to prevent duplicate processing on retry |

---

## Verification Pipeline

| Term | Definition |
|------|------------|
| **Preflight** | Deterministic image checks (URL validation, adversarial scan, blur detection, face likelihood) — runs BEFORE LLM |
| **LLM** | Groq vision model (`meta-llama/llama-4-scout-17b-16e-instruct`) that extracts structured data from images |
| **Thresholds** | Configurable pass/fail bars (confidence minimums, risk maximums, quality floors) |
| **Country Validator** | Deterministic server-side rules per country (e.g., Turkish TC checksum, MRZ cross-check) |
| **Quality Cap** | `effectiveQuality = min(llmQuality, captureSharpness)` — prevents inflated LLM scores on blurry images |

---

## Configuration

| Term | Definition |
|------|------------|
| **Flat Settings** | Simple key-value thresholds editable via Admin UI or `PUT /admin/settings` (e.g., `matchConfidence: 92`) |
| **Nested Config** | Advanced structured config via `PATCH /config` (workflows, validation rules, adapter selection) |
| **Preset** | Pre-bundled threshold set: `strict`, `balanced` (default), `lenient` — apply via `POST /config/preset` |
| **Policy Pack** | Versioned country-specific rule bundles (advanced) |

---

## Webhooks

| Term | Definition |
|------|------------|
| **Webhook Document** | Multi-webhook model: named endpoint with event subscriptions, signing key, data field allowlist |
| **Legacy Webhook** | Single `integrationWebhookUrl` + `integrationWebhookSecret` on KycConfiguration (deprecated) |
| **Signing Key** | 64-char hex `rawKey` (shown once) → stored as `SHA-256(rawKey)` → used as HMAC key |
| **Outcome Semantics** | `FINAL` = terminal, no retry expected; `RETRY_SUGGESTED` = user may re-attempt |

---

## Errors

| Term | Definition |
|------|------------|
| **Text Code** | Human-readable error code (e.g., `BLURRY_IMAGE`, `LOW_MATCH_CONFIDENCE`) |
| **Numeric Code** | Machine-readable code family (1xxx=missing data, 2xxx=invalid data, 3xxx=quality, 4xxx=selfie, 5xxx=system, 6xxx=flow, 7xxx=eID, 8xxx=screening) |
| **Preflight Failure** | Errors from deterministic checks (3001 `BLURRY_IMAGE`, 3008 `ADVERSARIAL_IMAGE_DETECTED`) — do not retry same image |

---

## Environments

| Term | Definition |
|------|------------|
| **Sandbox** | Test environment with `ak_test_` keys — deterministic fixtures, no LLM calls, no quota |
| **Production** | Live environment with `ak_live_` keys — real LLM, consumes monthly quota |
| **Tenant** | Your Armith account/organization — all API keys, configs, profiles belong to a tenant |

---

## Advanced

| Term | Definition |
|------|------------|
| **KYB** | Know Your Business — entity verification (manual CRUD, no automated doc check yet) |
| **Screening** | AML/sanctions/PEP check after ID verification (OpenSanctions, ComplyAdvantage, Diligence) |
| **eID NFC** | Cryptographic chip verification for eID documents (requires mobile NFC read) |
| **Async Verification** | BullMQ queue for background processing — returns `202 Accepted`, result via webhook/poll |
| **Manual Review** | `UNDER_REVIEW` queue for borderline cases — auto-escalation or admin-enqueued |
| **Bull Board** | Queue monitoring UI at `/ops/queues` (requires Redis) |

---

## What's Next?

- [How It Works](/concepts/how-it-works) — pipeline deep dive
- [Integration Patterns](/concepts/integration-patterns) — choose your path
- [Reference: Authentication](/reference/authentication) — auth details
- [Reference: Configuration](/reference/configuration) — thresholds & presets