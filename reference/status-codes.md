# Status Codes & Errors

## Statuses

**Checkpoints** (`id-check`/`selfie-check`/`eid-check` response, lowercase): `approved` · `pending` (ID ok, later checkpoints still needed) · `rejected` (business rule) · `failed` (system). Video Ident (`videocall-check`) is a separate product with the same status vocabulary; it does not gate KYC.

**Profile** (`GET /kyc/status/:profileId`, uppercase): `APPROVED` · `PENDING` · `REJECTED` · `FAILED` · `UNDER_REVIEW`. Lifecycle: `awaiting_id` · `awaiting_selfie` · `awaiting_screening` · `approved` · `rejected` · `failed` · `under_review`.

**Error shape:**
```json
{ "status": "failed", "errors": [{ "code": "BLURRY_IMAGE", "numericCode": 3001, "message": "...", "field": "frontImageUrl" }] }
```
(Middleware errors may be `{ "error": "..." }`.)

## Code Families

| Range | Category | Examples |
|-------|----------|----------|
| 1xxx | Missing ID data | `MISSING_IDENTITY_NUMBER`, `MISSING_DOB` |
| 2xxx | Invalid data/logic | `INVALID_IDENTITY_NUMBER`, `EXPIRED_ID`, `INVALID_AGE` |
| 3xxx | Image/quality | `BLURRY_IMAGE`, `ADVERSARIAL_IMAGE_DETECTED`, `LOW_DOCUMENT_VITALITY` |
| 4xxx | Selfie/liveness/match | `LOW_MATCH_CONFIDENCE`, `NO_FACE_DETECTED`, `SPOOFING_DETECTED` |
| 43xx | Video Ident | `VIDEOCALL_LIVENESS`, `VIDEOCALL_DEEPFAKE`, `VIDEOCALL_CONSENT_REQUIRED`, `VIDEOCALL_KYC_REQUIRED` |
| 5xxx | System | `GROQ_API_ERROR`, `INTERNAL_ERROR`, `INVALID_IMAGE_URL` |
| 6xxx | Flow/preconditions | `PROFILE_ID_REQUIRED`, `UNSUPPORTED_COUNTRY`, `IMAGE_TOO_LARGE`, `PLAN_LIMIT_REACHED` (429) |
| 7xxx | eID NFC | `EID_CHIP_AUTH_FAILED`, `EID_SOD_INVALID`, `EID_DATA_MISMATCH` |
| 8xxx | Screening/AML | `SANCTIONS_FLAGGED`, `PEP_FLAGGED`, `SCREENING_MISCONFIGURED` |

**Key actions:** `BLURRY_IMAGE`/`NO_FACE_DETECTED` → retake photo, don't retry same bytes · `PROFILE_ID_REQUIRED` → run `id-check` first · `PLAN_LIMIT_REACHED` (429, free: 20/mo) → upgrade/wait · `401/403` → check key + IP allowlist · `5xx`/`failed` → backoff + `Idempotency-Key` · `UNDER_REVIEW` → wait for `manual_review_resolved` webhook · screening flags → compliance review, never show hit details to end-user.

**Idempotency:** cached replay → `200` + `Idempotent-Replayed: true`; key+other body or in-flight → `409`.

Full fix per code: [Troubleshooting →](/troubleshooting/common-errors). UX copy per outcome: [Handle Results →](/guides/rest-api/handle-results).