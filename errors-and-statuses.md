# Statuses and Errors

How to interpret KYC API responses, error codes, and integration behavior.

## Status Values

### Checkpoint endpoints (`POST /kyc/id-check`, `POST /kyc/selfie-check`)

Return **lowercase** checkpoint/overall status in the JSON body:

| Status | Meaning |
|--------|---------|
| `approved` | Required checks passed for this step |
| `pending` | ID passed; selfie (or another step) still required |
| `rejected` | Business or security validation failed |
| `failed` | System/runtime failure |

### Status endpoint (`GET /kyc/status/:profileId`, `GET /kyc/sessions/:id`)

Returns **uppercase** persisted profile status:

| Status | Meaning |
|--------|---------|
| `APPROVED` | All required checkpoints passed |
| `PENDING` | Awaiting next required step |
| `REJECTED` | Validation failed |
| `FAILED` | System error |
| `UNDER_REVIEW` | Manual review queue |

Also includes `session.lifecycle` (`awaiting_id`, `awaiting_selfie`, `approved`, `under_review`, …) and per-checkpoint detail objects.

## Error Object Shape

Structured errors typically appear as:

```json
{
  "status": "failed",
  "errors": [
    {
      "code": "BLURRY_IMAGE",
      "numericCode": 3001,
      "message": "ID card image is too blurry to read clearly.",
      "field": "frontImageUrl"
    }
  ]
}
```

Some middleware responses use `{ "error": "Authentication required" }` without the `errors` array.

## Error Families (Numeric Ranges)

| Range | Category | Examples |
|-------|----------|----------|
| `1xxx` | Missing mandatory ID data | `MISSING_IDENTITY_NUMBER`, `MISSING_DOB` |
| `2xxx` | Invalid document data / logic | `INVALID_IDENTITY_NUMBER`, `EXPIRED_ID`, `INVALID_AGE` |
| `3xxx` | Document image / content quality | `BLURRY_IMAGE`, `ADVERSARIAL_IMAGE_DETECTED`, `LOW_DOCUMENT_VITALITY` |
| `4xxx` | Selfie / liveness / match | `LOW_MATCH_CONFIDENCE`, `NO_FACE_DETECTED`, `SPOOFING_DETECTED` |
| `5xxx` | System / runtime | `GROQ_API_ERROR`, `INTERNAL_ERROR`, `INVALID_IMAGE_URL` |
| `6xxx` | Flow / preconditions | `PROFILE_ID_REQUIRED`, `UNSUPPORTED_COUNTRY`, `IMAGE_TOO_LARGE` |

## High-Impact Error Codes

| textCode | When | Integration action |
|----------|------|-------------------|
| `BLURRY_IMAGE` | Laplacian sharpness below tenant threshold | Ask user to retake sharper photo |
| `ADVERSARIAL_IMAGE_DETECTED` | Byte-level heuristics flagged upload | Reject; do not retry same bytes |
| `NO_FACE_DETECTED` | Selfie preflight | Retake selfie with face centered |
| `PLAN_LIMIT_REACHED` | Monthly quota exceeded (HTTP 429) | Upgrade plan or wait for reset |
| `PROFILE_ID_REQUIRED` | Selfie called without profile when both steps required | Run `id-check` first |
| `PROFILE_ACCESS_DENIED` | Token/key cannot access profile | Check tenant scope |
| `ACCOUNT_IP_FORBIDDEN` / `API_KEY_IP_FORBIDDEN` | IP not on allowlist | Update CIDR rules |
| `IDENTITY_ALREADY_LINKED` | TC number bound to another user (HTTP 409) | Support workflow |

## Idempotency Responses

| HTTP | Header / body | Meaning |
|------|---------------|---------|
| 200 | `Idempotent-Replayed: true` | Cached prior success |
| 409 | body explains mismatch | Same key, different payload or in-flight duplicate |

## Webhook vs Poll

| Approach | Use when |
|----------|----------|
| **Webhooks** | Real-time terminal notifications; manual review events |
| **Status poll** | Backfill, reconciliation, or webhook-unavailable environments |

Terminal webhooks include `outcomeSemantics`:

- `FINAL` — no further automatic retry expected
- `RETRY_SUGGESTED` — user may retry upload flow

## Typical Integration Behavior

### On `PLAN_LIMIT_REACHED`

- Stop verification attempts for the period
- Surface upgrade path (free tier: **20** verifications/month)

### On `4xx` validation / preflight

- Show actionable user guidance (lighting, blur, framing)
- Do not blindly retry identical images

### On `401` / `403`

- Verify API key present and not revoked
- Check IP allowlists
- Rotate key under **Integrations → API Keys** if compromised

### On `5xx` / `failed`

- Retry with exponential backoff
- Use `Idempotency-Key` on `id-check` / `selfie-check`
- Log `profileId`, `correlationId`, and error payload

### On `UNDER_REVIEW`

- Hold user in pending state
- Listen for `verification.manual_review_resolved` webhook
- Or poll status until terminal

## UX Tips

- Map `textCode` to localized user strings; keep raw codes in logs
- Preserve `profileId` across your order/user records
- Distinguish **rejected** (user fixable) from **failed** (system)
- Treat capture sharpness errors separately from low LLM confidence — different remediation
