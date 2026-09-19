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
| `RESULT_CODE_NOT_READY` | 409 | Poll until terminal status before `POST /kyc/sessions/result-code` / hosted complete. |
| `RESULT_CODE_INVALID` | 400 | Code expired, already used, or `state` mismatch. Mint a fresh code. |
| `RESULT_CODE_STORE_UNAVAILABLE` | 503 | Redis required in production for result codes. Retry later. |
| `IDENTITY_ALREADY_LINKED` | 409 | Look up existing profile by national ID; don't duplicate. |
| `ACCOUNT_IP_FORBIDDEN` / `API_KEY_IP_FORBIDDEN` | 403 | Add server IP/CIDR to allowlist. |
| `CORS_FORBIDDEN` | 403 | Check `FRONTEND_URL` config / allowed origins. |
| `GROQ_API_ERROR` / `INTERNAL_ERROR` / `failed` | 5xx/200 | Backoff + retry with same `Idempotency-Key` (max 3). Log `profileId` + `X-Correlation-Id`. |
| `BIOMETRIC_FACE_MATCH_UNAVAILABLE` / `BIOMETRIC_LIVENESS_UNAVAILABLE` | 200 (rejected) | Production requires vendor biometrics (`PYTHON_BIOMETRICS_URL`, `REQUIRE_VENDOR_BIOMETRICS=1`). LLM cannot approve. |
| `SANCTIONS_HIT` (4101) | 200 | Route to compliance; never show hit details to user. |
| `PEP_HIT` (4102) | 200 | `UNDER_REVIEW` — compliance review. |
| `AML_NOT_CONFIGURED` / `AML_MISCONFIGURED` (4104/4103) | 200 | `requireAml` is on but `SCREENING_PROVIDER` is `none` or credentials are missing. |
| `MISSING_CHIP_DATA` / `SOD_SIGNATURE_INVALID` / `CHIP_VISUAL_MISMATCH` (7xxx) | 200/4xx | Retry NFC tap · tampering · chip vs visual mismatch. |
| `VIDEOCALL_KYC_REQUIRED` (4314) | 409 | KYC must be `APPROVED`, or turn off `videocallRequiresKycApproved`. |
| `VIDEOCALL_CONSENT_REQUIRED` (4313) | 400 | Send `recordingConsent: true` or `POST /kyc/sessions/consent`. |
| `VIDEOCALL_NO_AGENT` (4307) | 409 | Agent must claim the room (`decisionMode` default `agent_required`). |
| `VIDEOCALL_NO_FRAMES` (4315) | 200 | Need ≥ `minFrameCount` (default 3) scored stills. |
| `VIDEOCALL_ALREADY_CLAIMED` (4316) | 409 | Another agent owns the session (`claimedBy`). |
| `VIDEOCALL_NOT_CONFIGURED` (4309) | 503 | Set LiveKit URL + API key + secret in production. |
| `CAPTURE_SESSION_READ_ONLY` | 403 | Admin mint is v1 read. Use `POST /kyc/profiles` write tokens for `/w/start` / `/m/start`. |
| Webhook `401` on your endpoint | — | Key mismatch — re-check `rawKey`, raw-bytes signing, timestamp skew ≤300 s. |
| Callback `?error=expired/cancelled` | — | Mint fresh session (`POST /kyc/profiles/:id/sessions`); handle cancel in UI. |