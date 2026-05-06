# Step-by-Step API Flow

This is the practical integration walkthrough for API-only KYC.

## Step 0 - Set your base URL

```bash
export BASE_URL="https://armith-backend-live.onrender.com"
export TOKEN="<CLERK_BEARER_TOKEN>"
```

## Step 1 - Generate upload URLs

Request upload URL for ID front image:

```bash
curl -X POST "$BASE_URL/kyc/upload-url" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileType": "image/jpeg",
    "documentType": "id-front"
  }'
```

Response contains fields such as:

- `uploadUrl`
- `downloadUrl`
- optional file metadata

Repeat for:

- `id-back` (if needed)
- `selfie`

## Step 2 - Upload file bytes to `uploadUrl`

Use `PUT` directly to the returned URL:

```bash
curl -X PUT "<UPLOAD_URL_FROM_STEP_1>" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@./id-front.jpg"
```

Do this for all required images.

## Step 3 - Run ID verification

```bash
curl -X POST "$BASE_URL/kyc/id-check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "countryCode": "TR",
    "frontImageUrl": "<ID_FRONT_DOWNLOAD_URL>",
    "backImageUrl": "<ID_BACK_DOWNLOAD_URL>"
  }'
```

Key response fields:

- `status`
- `idStatus`
- `profileId`
- `data` (extracted ID fields)
- `confidenceScores`
- `rejectionReasons`

Save `profileId`; you need it for status polling and typical selfie step.

## Step 4 - Run selfie verification

```bash
curl -X POST "$BASE_URL/kyc/selfie-check" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "idPhotoUrl": "<ID_FRONT_DOWNLOAD_URL>",
    "selfieUrls": ["<SELFIE_DOWNLOAD_URL>"],
    "profileId": "<PROFILE_ID_FROM_ID_CHECK>"
  }'
```

Key response fields:

- `status`
- `selfieStatus`
- `confidenceScores`
- `rejectionReasons`

## Step 5 - Get final profile status

```bash
curl -X GET "$BASE_URL/kyc/status/<PROFILE_ID_FROM_ID_CHECK>" \
  -H "Authorization: Bearer $TOKEN"
```

This endpoint returns:

- consolidated profile status
- progress object
- ID verification details
- selfie verification details
- thresholds and verification rules used

## Step 6 - Handle outcomes in your app

### Approved

- Mark user as verified
- Unlock gated actions/features

### Pending

- Ask user to finish missing required step(s)

### Rejected

- Show user-friendly rejection reasons
- Let user retry if your policy allows

### Failed

- Treat as system error
- retry with backoff or surface support workflow
