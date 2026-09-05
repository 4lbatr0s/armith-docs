# Verify ID — REST API

Complete reference for `POST /kyc/id-check`.

---

## Endpoint

```
POST https://armith-backend-live.onrender.com/kyc/id-check
```

---

## Required Headers

| Header | Value |
|--------|-------|
| `x-api-key` | `ak_live_...` or `ak_test_...` |
| `Content-Type` | `application/json` |
| `Idempotency-Key` | **Recommended** — your unique key (24h TTL) |

---

## Request Body

```json
{
  "countryCode": "TR",
  "frontImageUrl": "https://...download-url...",
  "backImageUrl": "https://...download-url...",
  "integrationExternalRef": "order-12345",
  "integrationMetadata": {
    "channel": "mobile-app",
    "userId": "user_abc"
  },
  "async": false,
  "sandboxScenario": "approved"
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `countryCode` | string | Yes | ISO 3166-1 alpha-2 (e.g., `TR`, `DE`, `GB`) |
| `frontImageUrl` | string | Yes | `downloadUrl` from `upload-url` for ID front |
| `backImageUrl` | string | No | `downloadUrl` for ID back (required for some countries) |
| `integrationExternalRef` | string | No | Your reference (max 256 chars) — echoed in webhooks |
| `integrationMetadata` | object | No | Up to 20 keys, key ≤64, value ≤512, total ≤4 KB — echoed in webhooks |
| `async` | boolean | No | `true` = async (202 Accepted), `false` = sync (default) |
| `sandboxScenario` | string | No | **Sandbox only** — `approved`, `rejected_blur`, `rejected_tampering`, `rejected_mismatch`, `under_review` |

---

## Country Codes

Common codes: `TR` (Turkey), `DE` (Germany), `GB` (UK), `US` (US), `FR` (France), `NL` (Netherlands), `BE` (Belgium), `AT` (Austria), `CH` (Switzerland).

Full list: `GET /kyc/countries`

---

## Response

### Sync Success (200)
```json
{
  "status": "approved",
  "idStatus": "approved",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "data": {
    "fullName": "Ada Lovelace",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "identityNumber": "12345678901",
    "dateOfBirth": "1990-01-01",
    "expiryDate": "2030-01-01",
    "nationality": "TUR",
    "documentType": "id_card",
    "mrz": "...",
    "portraitUrl": "https://...cropped-portrait..."
  },
  "confidenceScores": {
    "fullName": 0.98,
    "identityNumber": 0.99,
    "dateOfBirth": 0.97,
    "expiryDate": 0.96,
    "overall": 0.95
  },
  "rejectionReasons": [],
  "errors": []
}
```

### Sync Rejected (200)
```json
{
  "status": "rejected",
  "idStatus": "rejected",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "rejectionReasons": [
    "EXPIRED_ID",
    "LOW_IDENTITY_NUMBER_CONFIDENCE"
  ],
  "errors": [
    {
      "code": "EXPIRED_ID",
      "numericCode": 2003,
      "message": "Document has expired",
      "field": "expiryDate"
    }
  ]
}
```

### Preflight Failure (400)
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

### Async (202 Accepted)
```json
{
  "status": "processing",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "runId": "e7b8c9d0-1a2b-3c4d-5e6f-7a8b9c0d1e2f"
}
```
> Poll `GET /kyc/status/:profileId` or wait for webhook.

---

## Response Fields

| Field | Description |
|-------|-------------|
| `status` | Overall: `approved`, `pending`, `rejected`, `failed` |
| `idStatus` | ID checkpoint result |
| `profileId` | **Primary key** — use for selfie, status, webhooks |
| `data` | Extracted fields (see below) |
| `confidenceScores` | Per-field confidence 0–1 |
| `rejectionReasons` | Array of text codes if rejected |
| `errors` | Detailed error objects if failed/rejected |

### Extracted Data Fields (`data`)

| Field | Description |
|-------|-------------|
| `fullName` | Full name as on document |
| `firstName`, `lastName` | Parsed name parts |
| `identityNumber` | National ID / document number |
| `dateOfBirth` | YYYY-MM-DD |
| `expiryDate` | YYYY-MM-DD |
| `nationality` | ISO 3166-1 alpha-3 |
| `documentType` | `id_card`, `passport`, `residence_permit`, etc. |
| `mrz` | Raw MRZ string (if present) |
| `portraitUrl` | Cropped face from ID front |
| `issuingCountry`, `issuingAuthority` | If available |
| `personalNumber`, `sex`, `height`, `eyeColor` | If on document |

---

## Idempotency

| Scenario | Response |
|----------|----------|
| Same key + same body (within 24h) | `200` with `Idempotent-Replayed: true` header |
| Same key + different body | `409 Conflict` |
| In-flight duplicate | `409 Conflict` |

> Always generate unique key per attempt: `id-check-${orderId}-${attempt}`

---

## Sandbox Testing

Use `ak_test_` key + `sandboxScenario`:

```json
{
  "countryCode": "TR",
  "frontImageUrl": "https://example.com/test.jpg",
  "sandboxScenario": "approved"
}
```

| Scenario | Result |
|----------|--------|
| `approved` | ID passes, high confidence |
| `rejected_blur` | `BLURRY_IMAGE` (3001) |
| `rejected_tampering` | Tampering risk > threshold |
| `rejected_mismatch` | Face/identity mismatch |
| `under_review` | Borderline → `UNDER_REVIEW` |

---

## What's Next?

- [Verify Selfie](/guides/rest-api/verify-selfie) — selfie check
- [Check Status](/guides/rest-api/check-status) — polling
- [Handle Results](/guides/rest-api/handle-results) — user messages
- [Async Verification](/advanced/async-verification) — background processing
- [Sandbox Testing](/reference/sandbox-testing) — test scenarios