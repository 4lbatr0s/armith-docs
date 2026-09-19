# Verify Selfie — REST API

Complete reference for `POST /kyc/selfie-check`.

---

## Endpoint

```
POST https://armith-backend-live.onrender.com/kyc/selfie-check
```

---

## Prerequisites

- **ID check must complete first** — you need the `profileId` from `id-check`
- Selfie verification required when tenant config requires both ID and selfie

---

## Required Headers

| Header | Value |
|--------|-------|
| `x-api-key` | `ak_live_...` or `ak_test_...` |
| `Content-Type` | `application/json` |
| `Idempotency-Key` | **Recommended** — your unique key (24h TTL) |

---

## Request Body

```json
{
  "idPhotoUrl": "https://...id-front-download-url...",
  "selfieUrls": ["https://...selfie-download-url..."],
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "integrationExternalRef": "order-12345",
  "integrationMetadata": {"channel": "mobile-app"},
  "async": false,
  "sandboxScenario": "approved"
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idPhotoUrl` | string | Yes | `downloadUrl` from ID front upload (portrait source) |
| `selfieUrls` | string[] | Yes | Array of selfie `downloadUrl`s (1–3 recommended) |
| `profileId` | string | Yes | From `id-check` response |
| `integrationExternalRef` | string | No | Your reference (max 256 chars) |
| `integrationMetadata` | object | No | Up to 20 keys, echoed in webhooks |
| `async` | boolean | No | `true` = async (202), `false` = sync (default) |
| `sandboxScenario` | string | No | **Sandbox only** — `approved`, `rejected_mismatch`, `rejected_blur`, `under_review` |

---

## Response

### Sync Success (200)
```json
{
  "status": "approved",
  "selfieStatus": "approved",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "confidenceScores": {
    "matchConfidence": 96,
    "spoofingRisk": 0.03,
    "livenessConfidence": 0.94,
    "faceQuality": 0.89,
    "lightingQuality": 0.91,
    "faceCoverage": 0.93
  },
  "rejectionReasons": [],
  "errors": []
}
```

### Sync Rejected (200)
```json
{
  "status": "rejected",
  "selfieStatus": "rejected",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "confidenceScores": {
    "matchConfidence": 65,
    "spoofingRisk": 0.42
  },
  "rejectionReasons": [
    "LOW_MATCH_CONFIDENCE",
    "SPOOFING_DETECTED"
  ],
  "errors": [
    {
      "code": "LOW_MATCH_CONFIDENCE",
      "numericCode": 4001,
      "message": "Face match confidence below threshold",
      "field": "matchConfidence"
    },
    {
      "code": "SPOOFING_DETECTED",
      "numericCode": 4004,
      "message": "Potential spoofing attack detected",
      "field": "spoofingRisk"
    }
  ]
}
```

### Preflight Failure (400)
```json
{
  "status": "failed",
  "errors": [
    {
      "code": "NO_FACE_DETECTED",
      "numericCode": 4002,
      "message": "No face detected in selfie image",
      "field": "selfieUrls[0]"
    }
  ]
}
```

---

## Response Fields

| Field | Description |
|-------|-------------|
| `status` | Overall profile status after this step |
| `selfieStatus` | Selfie checkpoint result |
| `profileId` | Same as request |
| `confidenceScores.matchConfidence` | Face match 0–100 (threshold default: 92) |
| `confidenceScores.spoofingRisk` | 0–1 (threshold default: ≤0.25) |
| `confidenceScores.livenessConfidence` | Passive liveness 0–1 |
| `confidenceScores.faceQuality` | Selfie quality 0–1 |
| `confidenceScores.lightingQuality` | Lighting assessment 0–1 |
| `confidenceScores.faceCoverage` | Face size/coverage 0–1 |
| `rejectionReasons` | Array of text codes if rejected |
| `errors` | Detailed error objects |

---

## Selfie vs ID Strictness

| Checkpoint | Strictness | Notes |
|------------|------------|-------|
| **ID** | Lenient | Warnings alone may still approve; only **critical** errors reject |
| **Selfie** | Strict | **Any** validation error → rejected |

> Selfie fails on: low match, spoofing, no face, poor quality, bad lighting, angle issues.

In production, vendor face-match and PAD scores are **authoritative**. Groq vision still runs as a shadow signal. PAD below `PAD_MIN_SCORE` (default 0.45) → `SPOOFING_DETECTED`. Missing required vendor host → `BIOMETRIC_FACE_MATCH_UNAVAILABLE` / `BIOMETRIC_LIVENESS_UNAVAILABLE` (fail closed, no LLM fallback).

---

## Multiple Selfies

Send up to 3 for best match selection:

```json
{
  "selfieUrls": [
    "https://...selfie1...",
    "https://...selfie2...",
    "https://...selfie3..."
  ]
}
```

System evaluates each and picks the best match.

---

## Idempotency

Same as ID check — use unique key per attempt:
```
Idempotency-Key: selfie-check-${profileId}-${attempt}
```

---

## Sandbox Testing

Use `ak_test_` key + `sandboxScenario`:

```json
{
  "idPhotoUrl": "https://example.com/id.jpg",
  "selfieUrls": ["https://example.com/selfie.jpg"],
  "profileId": "PROFILE_ID",
  "sandboxScenario": "approved"
}
```

| Scenario | Result |
|----------|--------|
| `approved` | High match confidence, low spoofing |
| `rejected_mismatch` | Low match confidence |
| `rejected_blur` | `BLURRY_IMAGE` on selfie |
| `under_review` | Borderline spoofing → `UNDER_REVIEW` |

---

## Common Errors

| Code | Meaning | User Action |
|------|---------|-------------|
| `LOW_MATCH_CONFIDENCE` | Face doesn't match ID portrait | Retake selfie, better lighting |
| `SPOOFING_DETECTED` | Screen/photo/print detected | Live selfie only, no screens |
| `NO_FACE_DETECTED` | No face in frame | Center face, good lighting |
| `POOR_SELFIE_QUALITY` | Blurry/dark/overexposed | Retake with flash/auto |
| `FACE_COVERAGE_LOW` | Face too small in frame | Move closer to camera |
| `MULTIPLE_FACES` | More than one face detected | Solo selfie only |

---

## What's Next?

- [Verify Video Ident](/guides/rest-api/verify-videocall) — live recorded call
- [Check Status](/guides/rest-api/check-status) — poll for final result
- [Handle Results](/guides/rest-api/handle-results) — user-facing messages
- [Webhooks](/guides/webhooks/get-started) — real-time delivery
- [Advanced: Threshold Tuning](/advanced/threshold-tuning) — adjust match/spoofing bars