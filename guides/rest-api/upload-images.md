# Upload Images — REST API

Details on file requirements, upload flow, and multiple images.

---

## Supported File Types

| Type | MIME | Max Size | Use For |
|------|------|----------|---------|
| JPEG | `image/jpeg` | 10 MB | ID front, ID back, selfie |
| PNG | `image/png` | 10 MB | ID front, ID back, selfie |
| WebP | `image/webp` | 10 MB | ID front, ID back, selfie |

> **Recommendation:** JPEG, ≤ 5 MB, ≥ 1 MP for best OCR/face match.

---

## Document Types

| `documentType` | Required? | Description |
|----------------|-----------|-------------|
| `id-front` | Yes | Front of ID card / passport data page |
| `id-back` | Country-dependent | Back of ID card (barcode, MRZ) |
| `selfie` | Config-dependent | User selfie for face match |

Check `GET /kyc/countries` for country-specific requirements.

---

## Upload Flow

### 1. Request Presigned URL
```bash
curl -X POST "$BASE/kyc/upload-url" \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileType": "image/jpeg", "documentType": "id-front"}'
```

### 2. Upload to Presigned URL (PUT)
```bash
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@image.jpg"
```

### 3. Use `downloadUrl` in Verification
```json
{
  "frontImageUrl": "DOWNLOAD_URL_FROM_STEP_1"
}
```

---

## Response Fields

| Field | Description |
|-------|-------------|
| `uploadUrl` | PUT target — expires in `expiresIn` seconds (default 300) |
| `downloadUrl` | GET URL — pass to `id-check`/`selfie-check` |
| `expiresIn` | Seconds until upload URL expires |
| `fileName` | Storage key (tenant-scoped: `users/{tenantId}/...`) |

---

## Multiple Images

### ID Front + Back
```bash
# Get both URLs
FRONT=$(curl ... -d '{"documentType":"id-front"}')
BACK=$(curl ... -d '{"documentType":"id-back"}')

# Upload both
curl -X PUT "$FRONT_UPLOAD" -H "Content-Type: image/jpeg" --data-binary "@front.jpg"
curl -X PUT "$BACK_UPLOAD" -H "Content-Type: image/jpeg" --data-binary "@back.jpg"

# Verify
curl -X POST "$BASE/kyc/id-check" -d '{
  "countryCode": "TR",
  "frontImageUrl": "'$FRONT_DOWNLOAD'",
  "backImageUrl": "'$BACK_DOWNLOAD'"
}'
```

### Multiple Selfies (for better match)
```bash
curl -X POST "$BASE/kyc/selfie-check" -d '{
  "idPhotoUrl": "ID_FRONT_URL",
  "selfieUrls": ["SELFIE_1_URL", "SELFIE_2_URL"],
  "profileId": "PROFILE_ID"
}'
```
> System picks best match. Max 3 selfies recommended.

---

## Secure Download (If You Have Storage Keys)

If you stored object keys and need fresh GET URLs:

```bash
curl -X POST "$BASE/kyc/secure-download-url" \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "users/TENANT_ID/id-front.jpeg"}'
```

---

## Constraints & Limits

| Limit | Value |
|-------|-------|
| Max file size | 10 MB |
| Upload URL TTL | 300 seconds (5 min) |
| Download URL TTL | 24 hours |
| Max selfies per check | 3 (recommended) |
| Storage scope | `users/{tenantMongoId}/...` — isolated per tenant |

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `400 Invalid fileType` | Wrong MIME type | Use `image/jpeg`, `image/png`, or `image/webp` |
| `400 File too large` | > 10 MB | Compress image |
| `403 Forbidden` on upload | Upload URL expired | Request new upload URL |
| `INVALID_IMAGE_URL` on verify | Download URL expired/wrong | Use fresh `downloadUrl` from upload response |
| `IMAGE_TOO_LARGE` | Backend limit | Resize before upload |

---

## What's Next?

- [Verify ID](/guides/rest-api/verify-id) — ID check parameters
- [Verify Selfie](/guides/rest-api/verify-selfie) — selfie check parameters
- [Check Status](/guides/rest-api/check-status) — polling
- [Sandbox Testing](/reference/sandbox-testing) — test with deterministic fixtures