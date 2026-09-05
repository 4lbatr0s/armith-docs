# REST API — Get Started

Complete backend-to-backend integration in 5 steps.

---

## Prerequisites

- [ ] Armith account with dashboard access
- [ ] API key from **Integrations → API Keys** (choose **Live** for production, **Sandbox** for testing)
- [ ] Backend server that can make HTTPS requests
- [ ] Test images: ID front (required), ID back (optional), selfie (if required)

---

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Sandbox / Shared Dev | `https://armith-backend-live.onrender.com` |
| Production | `https://api.armith.com` (or your dedicated tenant domain) |

> Use `ak_test_` keys with sandbox, `ak_live_` keys with production.

---

## Step 1: Health Check

```bash
curl -sS "https://armith-backend-live.onrender.com/health"
```

**Expected:** `{"status":"ok"}`

---

## Step 2: Get Upload URLs

Get presigned URLs for each image you'll upload.

### ID Front (required)
```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/upload-url" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileType": "image/jpeg", "documentType": "id-front"}'
```

**Response:**
```json
{
  "uploadUrl": "https://...r2.cloudflarestorage.com/...",
  "downloadUrl": "https://...r2.cloudflarestorage.com/...",
  "expiresIn": 300
}
```
> Save `downloadUrl` — pass this to verification endpoints.

### ID Back (if required by country)
```bash
curl -X POST "..." -d '{"fileType": "image/jpeg", "documentType": "id-back"}'
```

### Selfie (if selfie verification enabled)
```bash
curl -X POST "..." -d '{"fileType": "image/jpeg", "documentType": "selfie"}'
```

---

## Step 3: Upload Images

Upload each file to its `uploadUrl` using PUT.

```bash
curl -X PUT "UPLOAD_URL_FROM_STEP_2" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@./id-front.jpg"
```

> Repeat for ID back and selfie. Upload all before calling verification.

---

## Step 4: Run ID Verification

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/id-check" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: id-check-$(uuidgen)" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "DOWNLOAD_URL_FROM_STEP_2",
    "backImageUrl": "BACK_DOWNLOAD_URL_IF_APPLICABLE",
    "integrationExternalRef": "order-12345",
    "integrationMetadata": {"channel": "mobile-app"}
  }'
```

**Key Response Fields:**
| Field | Description |
|-------|-------------|
| `status` | Overall: `approved`, `pending`, `rejected`, `failed` |
| `idStatus` | ID checkpoint result |
| `profileId` | **Save this** — required for selfie & status polling |
| `data` | Extracted fields (name, DOB, ID number, expiry, MRZ, etc.) |
| `confidenceScores` | Per-field confidence 0–1 |
| `rejectionReasons` | If rejected, why |

---

## Step 5: Run Selfie Verification (If Required)

Required when tenant config requires both ID and selfie.

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/selfie-check" \
  -H "x-api-key: ak_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: selfie-check-PROFILE_ID" \
  -d '{
    "idPhotoUrl": "ID_FRONT_DOWNLOAD_URL",
    "selfieUrls": ["SELFIE_DOWNLOAD_URL"],
    "profileId": "PROFILE_ID_FROM_ID_CHECK"
  }'
```

**Key Response Fields:**
| Field | Description |
|-------|-------------|
| `status`, `selfieStatus` | Overall and selfie checkpoint status |
| `confidenceScores.matchConfidence` | Face match 0–100 |
| `rejectionReasons` | If rejected: `LOW_MATCH_CONFIDENCE`, `SPOOFING_DETECTED`, etc. |

---

## Step 6: Check Profile Status

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyc/status/PROFILE_ID" \
  -H "x-api-key: ak_live_YOUR_KEY"
```

**Response includes:**
- `status` (uppercase): `APPROVED`, `PENDING`, `REJECTED`, `FAILED`, `UNDER_REVIEW`
- `session.lifecycle`: `awaiting_id`, `awaiting_selfie`, `approved`, etc.
- `idVerification`, `selfieVerification`, `eidNfcVerification` detail objects
- `screening` status if enabled
- `thresholds` snapshot used for evaluation
- `images` stored URLs

> Alias: `GET /kyc/sessions/:profileId` (same handler)

---

## Step 7: Handle Outcomes

| Outcome | Action |
|---------|--------|
| `APPROVED` | Unlock gated features |
| `PENDING` | Prompt user to complete selfie (or missing step) |
| `REJECTED` | Show user-friendly reasons from `rejectionReasons`; allow re-upload |
| `UNDER_REVIEW` | Wait for manual resolution or listen for webhook |
| `FAILED` | Retry with backoff + `Idempotency-Key` |
| `PLAN_LIMIT_REACHED` (429) | Upgrade plan or wait for reset (free: 20/mo) |

---

## Best Practices

1. **Always use `Idempotency-Key`** on `id-check`, `selfie-check`, `eid-check` — prevents duplicate charges on retry
2. **Store `profileId`** with your user/order record
3. **Use webhooks** for real-time results instead of polling
4. **Test with `ak_test_` keys** first — no quota, deterministic results
5. **Don't retry preflight failures** (`BLURRY_IMAGE`, `ADVERSARIAL_IMAGE_DETECTED`) — ask user to retake

---

## Full Example Script

```bash
#!/bin/bash
set -e

BASE="https://armith-backend-live.onrender.com"
KEY="ak_live_YOUR_KEY"
IDEMPOTENCY="idem-$(date +%s)"

# 1. Health
curl -sS "$BASE/health"

# 2. Upload URLs
FRONT=$(curl -sS -X POST "$BASE/kyc/upload-url" \
  -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"fileType":"image/jpeg","documentType":"id-front"}')
UPLOAD_URL=$(echo $FRONT | jq -r .uploadUrl)
DOWNLOAD_URL=$(echo $FRONT | jq -r .downloadUrl)

# 3. Upload
curl -X PUT "$UPLOAD_URL" -H "Content-Type: image/jpeg" --data-binary "@id-front.jpg"

# 4. ID Check
ID_RESULT=$(curl -sS -X POST "$BASE/kyc/id-check" \
  -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY" \
  -d "{\"countryCode\":\"TR\",\"frontImageUrl\":\"$DOWNLOAD_URL\"}")

PROFILE_ID=$(echo $ID_RESULT | jq -r .profileId)
echo "Profile ID: $PROFILE_ID"

# 5. Status
curl -sS -X GET "$BASE/kyc/status/$PROFILE_ID" -H "x-api-key: $KEY" | jq .
```

---

## What's Next?

- [Upload Images](/guides/rest-api/upload-images) — details on file types, sizes, multiple uploads
- [Verify ID](/guides/rest-api/verify-id) — all ID check parameters, country-specific fields
- [Verify Selfie](/guides/rest-api/verify-selfie) — selfie check options, multiple selfies
- [Check Status](/guides/rest-api/check-status) — polling strategies, progress tracking
- [Handle Results](/guides/rest-api/handle-results) — user-facing messages, retry logic
- [Webhooks](/guides/webhooks/get-started) — real-time results
- [Sandbox Testing](/reference/sandbox-testing) — test scenarios without quota