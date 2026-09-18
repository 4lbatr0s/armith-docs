# How Armith KYC Works

A high-level mental model of the verification pipeline.

---

## The Big Picture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│  YOUR APP   │────►│  ARMITH API  │────►│  PREFLIGHT  │────►│    LLM     │
│             │     │              │     │  (instant)  │     │  (Groq)    │
└─────────────┘     └──────────────┘     └─────────────┘     └────────────┘
                                                                       │
                                                                       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│  WEBHOOK    │◄────│  PERSIST &   │◄────│  VALIDATE   │◄────│  EXTRACT   │
│  / POLL     │     │  DECIDE      │     │  (rules +   │     │  FIELDS    │
│             │     │              │     │  biometrics)│     │            │
└─────────────┘     └──────────────┘     └─────────────┘     └────────────┘
```

---

## Step-by-Step

### 1. You Send Images
- **REST API:** You upload to presigned URLs, send download URLs to Armith
- **Hosted Capture:** User uploads on Armith's page, we handle upload
- **Mobile SDK:** Your app uploads via our SDK

### 2. Preflight (Instant, Deterministic)
Before any AI runs, we check:
| Check | What It Catches |
|-------|-----------------|
| URL valid & accessible | Broken links, wrong permissions |
| File type & size | Non-images, huge files |
| Adversarial scan | Prompt injection, manipulated bytes |
| Blur detection (Laplacian) | Out-of-focus, motion blur |
| Face likelihood (selfie) | No face in frame |

**Fail here → Instant rejection, no LLM call, no quota used.**

### 3. LLM Analysis (Groq Vision)
We send images to `meta-llama/llama-4-scout-17b-16e-instruct` with a structured prompt per country.

**ID Check extracts:** Name, DOB, ID number, expiry, MRZ, document type, issuing country, portrait crop

**Selfie Check extracts:** Face match % vs ID portrait, spoofing risk, liveness, quality, lighting, face coverage. In production, **vendor biometrics** (SFace match + anti-spoof PAD) are the decision authority; Groq match/liveness are shadow scores (logged on disagreement, never used to approve).

### 4. Server-Side Validation (The Real Decision)
The server **makes the final APPROVED/REJECTED decision** using:

| Layer | Examples |
|-------|----------|
| **Country validators** | Turkish TC checksum, MRZ cross-check |
| **Vendor biometrics** | Face similarity vs `selfieThresholds.minMatchConfidence` (default 92); PAD below `PAD_MIN_SCORE` (default 0.45) → `SPOOFING_DETECTED` |
| **Thresholds** | `matchConfidence ≥ 92`, `spoofingRisk ≤ 0.25` |
| **Business rules** | Age ≥ 18, document not expired, tampering risk low |
| **Quality caps** | `effectiveQuality = min(llmQuality, captureSharpness)` |

> **Key insight:** LLM output is advisory. Server rules and vendor biometrics are the gate. If required vendor biometrics are missing, selfie fails closed (`BIOMETRIC_FACE_MATCH_UNAVAILABLE` / `BIOMETRIC_LIVENESS_UNAVAILABLE`).

### 5. Result & Webhook
- Profile status: `APPROVED` | `REJECTED` | `FAILED` | `PENDING` | `UNDER_REVIEW`
- Webhook delivered (if configured): `verification.completed` or `verification.failed`
- Poll anytime: `GET /kyc/status/:profileId`

---

## Two Checkpoints (When Both Enabled)

```
ID CHECK          SELFIE CHECK          FINAL
────────          ────────────          ─────
APPROVED    +     APPROVED      =      APPROVED
APPROVED    +     REJECTED      =      REJECTED
APPROVED    +     (not done)    =      PENDING
REJECTED    +     (skipped)     =      REJECTED
```

**Selfie is stricter:** Any validation error → REJECTED. ID allows warnings.

---

## Integration Patterns

| Pattern | You Build | Armith Builds | Latency |
|---------|-----------|---------------|---------|
| **REST API** | Upload UI, orchestration | Verification engine | ~2-4s sync |
| **Hosted Capture** | Backend session + callback | Full capture UI + verification | User-paced |
| **Mobile SDK** | App + optional camera UI | Headless client + verification | ~2-4s sync |

---

## Environments

| Environment | Base URL | Use For |
|-------------|----------|---------|
| **Sandbox** | `https://armith-backend-live.onrender.com` | Testing with `ak_test_` keys (deterministic, no quota) |
| **Production** | `https://api.armith.com` (or your tenant domain) | Live traffic with `ak_live_` keys |

---

## Key Concepts

| Term | Meaning |
|------|---------|
| **Profile** | A verification session (one person, one flow) |
| **ProfileId** | MongoDB ObjectId, the primary key for all calls |
| **Checkpoint** | One KYC verification step: ID, Selfie, or eID NFC. Video Ident is a separate product. |
| **Vendor biometrics** | Production face-match + PAD host (`PYTHON_BIOMETRICS_URL`); required when `REQUIRE_VENDOR_BIOMETRICS=1` |
| **Preflight** | Deterministic image checks before LLM |
| **Thresholds** | Configurable pass/fail bars (confidence, risk, quality) |
| **Webhook** | HTTPS POST we send on terminal events |
| **Sandbox** | Test mode with `ak_test_` keys, deterministic fixtures |

---

## What's Next?

- [Integration Patterns](/concepts/integration-patterns) — choose your path
- [Quickstart](/quickstart) — 5-min tutorial for your path
- [Authentication](/reference/authentication) — how auth works
- [Configuration](/reference/configuration) — thresholds, presets, rules