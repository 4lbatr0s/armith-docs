# Step-by-Step API Flow

Practical walkthrough for API-only KYC integration.

## Step 0 — Environment variables

```bash
export BASE_URL="https://armith-backend-live.onrender.com"
export API_KEY="ak_live_<YOUR_KEY>"
```

Create the API key under **Integrations → API Keys** in the dashboard.

## Step 1 — Generate upload URLs

ID front:

```bash
curl -X POST "$BASE_URL/kyc/upload-url" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "documentType": "id-front"
  }'
```

Repeat for `id-back` (if required) and `selfie`.

Response fields:

- `uploadUrl` — presigned PUT target
- `downloadUrl` — pass to verification endpoints
- `expiresIn` — typically 300 seconds

Storage keys are scoped to `users/{tenantMongoId}/…`.

## Step 2 — Upload file bytes

```bash
curl -X PUT "<UPLOAD_URL_FROM_STEP_1>" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@./id-front.jpg"
```

Upload all required images before calling verification.

## Step 3 — Run ID verification

```bash
curl -X POST "$BASE_URL/kyc/id-check" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: id-check-$(uuidgen)" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "<ID_FRONT_DOWNLOAD_URL>",
    "backImageUrl": "<ID_BACK_DOWNLOAD_URL>",
    "integrationExternalRef": "order-12345",
    "integrationMetadata": {
      "channel": "mobile-app"
    }
  }'
```

Key response fields:

- `status` — overall profile status after this step (`approved`, `pending`, `rejected`, `failed`)
- `idStatus` — ID checkpoint result
- `profileId` — **required for selfie and status polling**
- `data` — extracted ID fields
- `confidenceScores`, `rejectionReasons`, `errors`

Save `profileId`.

## Step 4 — Run selfie verification

Required when tenant rules require both ID and selfie:

```bash
curl -X POST "$BASE_URL/kyc/selfie-check" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: selfie-check-<profileId>" \
  -d '{
    "idPhotoUrl": "<ID_FRONT_DOWNLOAD_URL>",
    "selfieUrls": ["<SELFIE_DOWNLOAD_URL>"],
    "profileId": "<PROFILE_ID_FROM_ID_CHECK>"
  }'
```

Key response fields:

- `status`, `selfieStatus`
- `confidenceScores` (includes `matchConfidence` 0–100)
- `rejectionReasons`

## Step 5 — Get profile status

```bash
curl -X GET "$BASE_URL/kyc/status/<PROFILE_ID>" \
  -H "x-api-key: $API_KEY"
```

Alias: `GET /kyc/sessions/<PROFILE_ID>` (same handler).

Returns:

- Uppercase `status` (`PENDING`, `APPROVED`, …)
- `progress` — which steps completed
- `idVerification`, `selfieVerification` detail objects
- `thresholds` — flat threshold snapshot used for evaluation
- `session.lifecycle` — high-level state (`awaiting_selfie`, `approved`, …)

## Step 6 — Secure download (optional)

If you stored object keys and need a fresh GET URL:

```bash
curl -X POST "$BASE_URL/kyc/secure-download-url" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "fileName": "users/<tenantId>/id-front.jpeg" }'
```

## Step 7 — Handle outcomes

### Approved (`APPROVED` / `approved`)

Unlock gated features in your product.

### Pending (`PENDING` / `pending`)

Prompt user to complete selfie (or missing step).

### Rejected (`REJECTED` / `rejected`)

Show user-friendly reasons from `rejectionReasons` / `errors`. Allow re-upload if policy permits.

### Under review (`UNDER_REVIEW`)

Wait for manual resolution or subscribe to `verification.manual_review_*` webhooks.

### Failed (`FAILED` / `failed`)

Treat as system error; retry with backoff and `Idempotency-Key`.

### Plan limit (`PLAN_LIMIT_REACHED`, HTTP 429)

Monthly quota exceeded (free tier: 20 verifications/month). Upgrade plan or wait for period reset.

### Preflight failures (`BLURRY_IMAGE`, `ADVERSARIAL_IMAGE_DETECTED`)

Ask user to retake photos — do not retry identical uploads. See [Verification & Preflight](/verification-and-preflight).

## Step 8 — Webhooks (recommended)

Register HTTPS endpoints in **Integrations → Webhooks** to receive:

- `verification.completed`
- `verification.failed`
- `verification.manual_review_queued`
- `verification.manual_review_resolved`

See [Outbound Webhooks](/webhooks) for signing verification.
