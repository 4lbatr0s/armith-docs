# Troubleshooting: Common Errors

Actionable fixes. For user-facing copy see [Handle Results →](/guides/rest-api/handle-results).

| Code | HTTP | Fix |
|------|------|-----|
| `BLURRY_IMAGE` (3001) | 400 | Retake: steady hands, good light, tap-to-focus. Don't retry same bytes. Consider lowering sharpness gate ([Tuning →](/advanced/threshold-tuning)). |
| `ADVERSARIAL_IMAGE_DETECTED` | 400 | Reject upload; never retry same file. Log for fraud review. |
| `NO_FACE_DETECTED` (4002) | 400 | Center face, remove sunglasses/mask, improve lighting. |
| `LOW_MATCH_CONFIDENCE` | 200 (rejected) | Retake selfie in daylight; remove accessories; move closer. Raise `matchConfidence` only if impostors are passing. |
| `SPOOFING_DETECTED` | 200 (rejected) | Require live camera; block screens/prints. Check `spoofingRiskMax`. |
| `EXPIRED_ID` | 200 (rejected) | Ask for valid document. |
| `INVALID_IDENTITY_NUMBER` / `MISSING_*` | 200 (rejected) | Retake front clearly; check country validator ([How It Works →](/concepts/how-it-works)). |
| `PROFILE_ID_REQUIRED` | 4xx | Call `id-check` first; pass its `profileId` to selfie. |
| `UNSUPPORTED_COUNTRY` | 4xx | Check `GET /kyc/countries`. |
| `IMAGE_TOO_LARGE` / `INVALID_IMAGE_URL` | 4xx | Compress ≤10 MB; use fresh `downloadUrl` (upload URLs expire in 300 s). |
| `PLAN_LIMIT_REACHED` | 429 | Upgrade or wait; switch dev to `ak_test_`. |
| `RESULT_CODE_NOT_READY` | 409 | Poll until terminal status before `POST /kyc/sessions/complete`. |
| `IDENTITY_ALREADY_LINKED` | 409 | Look up existing profile by national ID; don't duplicate. |
| `ACCOUNT_IP_FORBIDDEN` / `API_KEY_IP_FORBIDDEN` | 403 | Add server IP/CIDR to allowlist. |
| `CORS_FORBIDDEN` | 403 | Check `FRONTEND_URL` config / allowed origins. |
| `GROQ_API_ERROR` / `INTERNAL_ERROR` / `failed` | 5xx/200 | Backoff + retry with same `Idempotency-Key` (max 3). Log `profileId` + `X-Correlation-Id`. |
| `SANCTIONS_FLAGGED` / `PEP_FLAGGED` | 200 | Route to compliance; never show hit details to user. |
| `SCREENING_MISCONFIGURED` | 200 | Check `adapters.screening` + provider credentials. |
| `EID_*` (7xxx) | 200/4xx | `CHIP_AUTH_FAILED` → retry tap · `SOD_INVALID` → tampering · `DATA_MISMATCH` → manual review. |
| Webhook `401` on your endpoint | — | Key mismatch — re-check `rawKey`, raw-bytes signing, timestamp skew ≤300 s. |
| Callback `?error=expired/cancelled` | — | Mint fresh session (`POST /kyc/profiles/:id/sessions`); handle cancel in UI. |