# Sandbox Testing

Test without LLM calls or quota. Use a **Sandbox** key (`ak_test_...`, Dashboard → Integrations → API Keys) + `sandboxScenario` on `id-check` / `selfie-check`. Any image URL works — no upload needed.

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_test_YOUR_KEY" -H "Content-Type: application/json" \
  -d '{"countryCode": "TR", "frontImageUrl": "https://example.com/test.jpg", "sandboxScenario": "approved"}'
```

| Scenario | ID | Selfie | Profile | Error |
|----------|----|--------|---------|-------|
| `approved` | approved | approved | `APPROVED` | — |
| `rejected_blur` | rejected | — | `REJECTED` | `BLURRY_IMAGE` (3001) |
| `rejected_tampering` | rejected | — | `REJECTED` | `HIGH_TAMPERING_RISK` |
| `rejected_mismatch` | rejected | rejected | `REJECTED` | `LOW_MATCH_CONFIDENCE` |
| `under_review` | under_review | under_review | `UNDER_REVIEW` | — |

**Checklist:** test happy path **and** each rejection (your UX copy), `Idempotency-Key` replay, full flow (upload → ID → selfie → status → webhook), error callbacks (`?error=cancelled/expired`) for hosted. Use `ak_test_` in all dev/CI pipelines — never `ak_live_` for tests.

Video Ident has **no** `sandboxScenario`. LiveKit is stubbed only when `NODE_ENV` is `test` or `development`. Production Video Ident needs real LiveKit credentials.