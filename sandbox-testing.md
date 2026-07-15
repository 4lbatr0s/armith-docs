# Sandbox Testing

Armith provides a **sandbox environment** for integration testing without consuming quota or making real LLM calls. Sandbox API keys return **deterministic fixtures** based on the `sandboxScenario` parameter.

## Sandbox API Keys

Create a sandbox API key under **Integrations → API Keys** with environment set to **Sandbox**:

```
ak_test_<secret>
```

Sandbox keys:
- Do **not** call the Groq LLM
- Do **not** consume monthly verification quota
- Return deterministic results based on `sandboxScenario`
- Support the same API surface as live keys

## Using Sandbox Scenarios

Add the `sandboxScenario` parameter to ID check or selfie check requests:

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_test_<SANDBOX_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "https://example.com/sandbox-id-front.jpg",
    "backImageUrl": "https://example.com/sandbox-id-back.jpg",
    "sandboxScenario": "approved"
  }'
```

## Available Scenarios

### ID Check

| Scenario | Response |
|----------|----------|
| `approved` | ID verification passes with extracted fields and high confidence |
| `rejected_blur` | Preflight blur detection fails with `BLURRY_IMAGE` (code 3001) |
| `rejected_tampering` | LLM reports tampering risk above threshold |
| `rejected_mismatch` | Face/identity mismatch detected |
| `under_review` | Borderline scores trigger auto-escalation to `UNDER_REVIEW` |

### Selfie Check

| Scenario | Response |
|----------|----------|
| `approved` | Face match passes with high confidence |
| `rejected_mismatch` | Face match fails — low match confidence |
| `rejected_blur` | Selfie preflight blur detection fails |
| `under_review` | Borderline spoofing risk triggers manual review |

## Scenario Mapping

The `sandboxScenario` parameter maps to deterministic outcomes:

| Scenario | ID Status | Selfie Status | Profile Status | Error |
|----------|-----------|---------------|----------------|-------|
| `approved` | `approved` | `approved` | `APPROVED` | — |
| `rejected_blur` | `rejected` | — | `REJECTED` | `BLURRY_IMAGE` (3001) |
| `rejected_tampering` | `rejected` | — | `REJECTED` | `HIGH_TAMPERING_RISK` |
| `rejected_mismatch` | `rejected` | `rejected` | `REJECTED` | `LOW_MATCH_CONFIDENCE` |
| `under_review` | `under_review` | `under_review` | `UNDER_REVIEW` | — |

## Testing the Full Flow

A typical sandbox test sequence:

```bash
# 1. Create API key with sandbox environment
# 2. Health check
curl -sS "https://armith-backend-live.onrender.com/health"

# 3. Generate upload URL (mocked, no actual storage needed)
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: ak_test_<SANDBOX_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"fileType": "image/jpeg", "documentType": "id-front"}'

# 4. Run ID check with sandbox scenario
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_test_<SANDBOX_KEY>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(uuidgen)" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "https://example.com/test.jpg",
    "sandboxScenario": "approved"
  }'

# 5. Run selfie check
curl -X POST "https://armith-backend-live.onrender.com/kyc/selfie-check" \
  -H "x-api-key: ak_test_<SANDBOX_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "idPhotoUrl": "https://example.com/id.jpg",
    "selfieUrls": ["https://example.com/selfie.jpg"],
    "profileId": "<PROFILE_ID>",
    "sandboxScenario": "approved"
  }'

# 6. Check status
curl -X GET "https://armith-backend-live.onrender.com/kyc/status/<PROFILE_ID>" \
  -H "x-api-key: ak_test_<SANDBOX_KEY>"
```

## Testing Error Scenarios

Test your error handling:

```bash
# Blurry image rejection
curl -X POST "..." -d '{"sandboxScenario": "rejected_blurb", ...}'
# → 400 with BLURRY_IMAGE

# Tampering detection
curl -X POST "..." -d '{"sandboxScenario": "rejected_tampering", ...}'
# → 200 with rejection reasons

# Manual review escalation
curl -X POST "..." -d '{"sandboxScenario": "under_review", ...}'
# → 200 with status "pending" → profile status "UNDER_REVIEW"
```

## Best Practices

1. **Use `ak_test_` keys** for all development and CI/CD pipelines
2. **Test every scenario** before going live to ensure your error handling works
3. **Use `Idempotency-Key`** in sandbox to test idempotency behavior
4. **Test the full flow** — upload → ID → selfie → status → webhook
5. **Test error scenarios** — each rejection type should render appropriate UX
6. **Clean up sandbox profiles** via `DELETE /admin/verifications/:profileId` if needed
