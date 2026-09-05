# Verification & Preflight

Armith runs **deterministic preflight checks** before calling the LLM. This catches bad uploads early, saves quota, and prevents obviously unusable images from reaching vision models.

## Pipeline Summary

```
Image URLs → HEAD/size/MIME → adversarial byte scan → blur probe → (selfie) face heuristic → LLM → server thresholds → (optional) screening → persist
```

The server makes the **final** approve/reject decision. LLM output is structured advisory input capped by capture quality where applicable.

## Preflight Checks

### Storage validation

- URL format and tenant ownership (for Armith-scoped keys)
- R2 `HEAD` — object exists, content-type, size within limits
- Optional min dimension / megapixel gates (`KYC_MIN_IMAGE_DIMENSION`, `KYC_MIN_MEGAPIXELS`)

### Adversarial image heuristics

Scans the first ~64KB of each image for suspicious patterns:

- Abnormal entropy + high-frequency energy combinations
- Repeating byte blocks (non-natural compression)
- Metadata injection strings (prompt injection defense)

Failure: `ADVERSARIAL_IMAGE_DETECTED` (HTTP 400, code 3008 family).

### Blur probe (Laplacian variance)

1. Decode JPEG/PNG (up to 2MB sniff buffer)
2. Downsample to ~640px max edge
3. Compute Laplacian variance → normalized **sharpness score** 0–1 (higher = sharper)
4. Compare to tenant threshold

| Setting | Location | Default |
|---------|----------|---------|
| `idMinCaptureSharpness` | Admin Settings (flat) → `idCardThresholds.minCaptureSharpness` | **0.38** |
| `selfieMinCaptureSharpness` | Admin Settings → `selfieThresholds.minCaptureSharpness` | **0.38** |
| Platform fallback | `PREFLIGHT_MIN_BLUR_SCORE` env | **0.38** |

Tenant value overrides env fallback when set.

Failure: `BLURRY_IMAGE` (code 3001) — *"ID card image is too blurry to read clearly."*

### Selfie face likelihood

Lightweight heuristic on selfie bytes before LLM.

Failure: `NO_FACE_DETECTED` (code 4002).

Default floor: `PREFLIGHT_MIN_FACE_LIKELIHOOD` (0.06).

## Post-LLM Quality Cap

After the LLM returns quality scores, the backend may cap:

```text
effectiveImageQuality = min(llmImageQuality, captureSharpnessScore)
```

This prevents inflated LLM quality scores on blurry captures that somehow passed older configs.

## Prompt Architecture

Armith uses YAML prompt templates compiled at runtime with Handlebars:

- **System + user message split** — principles/schema in system; thresholds + few-shots in user
- **Shared scoring rubric** — `backend/verification/prompts/partials/scoring-rubric.v1.yaml`
- **Structured `reasoning` JSON** — persisted as `llmReasoning` on validation records
- **Per-prompt temperature** — ID `0.0`, selfie `0.08` (YAML header)
- **Prompt injection defense** in all prompts — image text is never treated as model instructions

### A/B Prompt Testing

Env vars enable A/B routing for prompt variants:

| Env var | Purpose |
|---------|---------|
| `PROMPT_AB_CANDIDATE_VERSION` | Candidate prompt version identifier |
| `PROMPT_AB_TRAFFIC_PCT` | Percentage of traffic to route to candidate (0–100) |

## LLM Provider

Default: **Groq** vision model (`meta-llama/llama-4-scout-17b-16e-instruct` class). Check `GET /kyc/llm-status` for live configuration.

| Feature | Detail |
|---------|--------|
| Primary provider | Groq |
| Vision model | `meta-llama/llama-4-scout-17b-16e-instruct` (or similar) |
| Fallback provider | `FALLBACK_LLM_PROVIDER` / OpenAI env vars |
| Two-stage routing | Opt-in: edge-case models for ambiguous results |
| Ensemble verification | Opt-in: multiple model inference for high-risk cases |

## Threshold Layers

### Flat admin keys (`GET/PUT /admin/settings`)

Common operator-facing keys:

| Flat key | Default (balanced) | Purpose |
|----------|-------------------|---------|
| `fullNameConfidence` | 0.80 | Min confidence for name fields |
| `identityNumberConfidence` | 0.90 | ID number extraction |
| `dateOfBirthConfidence` | 0.85 | DOB field |
| `expiryDateConfidence` | 0.85 | Expiry date |
| `minMrzConfidence` | 0.80 | MRZ read quality |
| `imageQuality` / `idMinImageQuality` | 0.62 | LLM image quality floor (ID) |
| `selfieMinImageQuality` | 0.62 | LLM image quality floor (selfie) |
| `idMinCaptureSharpness` | 0.38 | Preflight blur gate (ID) |
| `selfieMinCaptureSharpness` | 0.38 | Preflight blur gate (selfie) |
| `minDocumentVitalityConfidence` | 0.55 | Document liveness/vitality |
| `matchConfidence` | 92 | Face match bar (0–100) |
| `spoofingRiskMax` | 0.25 | Max acceptable spoofing risk |
| `faceDetectionConfidence` | 0.78 | Facial feature detection |
| `minLivenessConfidence` | 0.78 | Liveness signal |
| `minAge` / `maxAge` | 18 / 120 | Age validation |
| `enforceAgeCheck` | true | Toggle age rules |

### Nested config (`PATCH /config`)

Advanced fields not exposed as flat admin patches:

- `idCardThresholds.minOverallConfidence`, `maxTamperingRisk`
- `selfieThresholds.requiredFaceCount`, `minAngleDifference`, `requireMultipleAngles`
- `validationRules` — TC checksum, MRZ cross-validation, `maxWarningCount`, expiry rules, `warningEscalationStatus`
- `verificationFeatures` — auto manual review bands, `riskScoreCeiling`, `autoReviewConfidenceMin/Max`
- `adapters` — screening provider, face match, liveness

### Presets

`GET /config/presets` lists available threshold bundles:

| Preset | Description |
|--------|-------------|
| `strict` | High-security — lower tolerances, higher rejection |
| `balanced` | General purpose (default) |
| `lenient` | Higher pass rates, lower security |

Apply via `POST /config/preset`.

## ID vs Selfie Strictness

| Checkpoint | Strictness | Notes |
|------------|------------|-------|
| **ID** | Lenient | Warnings alone may still approve; only **critical** errors reject |
| **Selfie** | Strict | Any validation error → rejected |
| **eID NFC** | Strict | Both cryptographic and visual data must match |

## Auto Manual Review

Profiles may enter `UNDER_REVIEW` when:

- Warning count ≥ `maxWarningCount` (default 3)
- Composite `riskScore` > `riskScoreCeiling` (default 55)
- Borderline confidence or spoofing bands (`verificationFeatures.autoReview*`)

Webhook: `verification.manual_review_queued`.

## Deterministic Validators (Post-LLM)

Examples enforced server-side:

- Turkish ID (TC) checksum
- MRZ cross-validation (fields must match between printed and machine-readable zones)
- Age and expiry date rules
- Tampering risk ceiling
- Document condition allow-list
- Gender consistency (optional)

## Screening (Post-Verification)

Optional AML/sanctions/PEP screening runs after ID verification when configured:

- Provider: OpenSanctions (default), ComplyAdvantage, or Diligence
- Results stored on profile: `screening.status`, `screening.hits`, `sanctionsMatch`, `pepMatch`
- Screening can block profiles or flag for manual review

See [Screening](/screening).

## Policy Pack System

Armith supports policy packs for country-specific verification rules:

- `meta.policy.bundleVersion` — version of the active policy bundle
- `policyPackId` / `policyPackVersion` — specific pack identifier (when enabled)
- Packs are versioned and can be rolled back via `policyRevisionService`

## Tuning Guidance

| Symptom | Adjustment |
|---------|------------|
| Too many blurry uploads reaching LLM | Lower `idMinCaptureSharpness` / `selfieMinCaptureSharpness` (stricter) |
| Legitimate users rejected for motion blur | Slightly raise threshold (e.g. 0.32) or improve capture UX |
| False face match approvals | Raise `matchConfidence` (e.g. 95+) |
| Too many auto reviews | Widen auto-review bands or raise `riskScoreCeiling` |
| Too many false rejections | Switch to `lenient` preset or adjust individual thresholds |
| High-risk documents passing | Switch to `strict` preset or lower `maxTamperingRisk` |

Changes via **Admin → Settings** apply to the tenant's production config document immediately for new verifications.
