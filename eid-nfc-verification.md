# eID NFC Verification

eID (electronic ID) cards contain an embedded cryptographic chip that can be read via NFC. Armith verifies the chip data against the visual document fields to provide an additional layer of security beyond optical character recognition.

## When to Use

eID NFC verification is recommended for:

- High-value financial transactions
- Accounts with elevated fraud risk
- Jurisdictions with eID infrastructure (EU, Turkey, UAE, Singapore)
- Regulatory requirements for cryptographic identity verification

## How It Works

1. **User taps their eID card** against an NFC-enabled mobile device
2. **Mobile app reads chip data**: document number, date of birth, expiry, nationality, surname, given names, signature, certificate chain
3. **Chip data is submitted** to Armith via `POST /kyc/eid-check`
4. **Armith validates**:
   - **Chip authentication** — cryptographic verification of the chip's authenticity
   - **SOD signature validation** — verification of the Document Signer certificate chain
   - **Document data match** — chip data matches the visual MRZ zone
   - **Visual data match** — chip data matches the ID card front image text
5. **Combined authenticity score** computed from all validation layers
6. **Result is persisted** on the profile alongside ID and selfie checkpoints

## API

### Submit eID NFC data

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyc/eid-check" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: eid-$(uuidgen)" \
  -d '{
    "profileId": "672a9c2e3f1b2c4d5e6f7890",
    "countryCode": "TR",
    "chipData": {
      "documentNumber": "U12345678",
      "dateOfBirth": "19900101",
      "expiryDate": "20300101",
      "nationality": "TUR",
      "surname": "LOVELACE",
      "givenNames": "ADA",
      "issuerAuthority": "TR-IC-DIRECTORATE"
    },
    "signatureAlg": "SHA256WithRSA",
    "certificateIssuer": "CN=TR-ID-Signing-CA",
    "certificateSubject": "CN=TR-ID-CHIP-U12345678"
  }'
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profileId` | string | yes | Profile ID from `id-check` response |
| `countryCode` | string | yes | Country code (e.g. `TR`) |
| `chipData.documentNumber` | string | yes | Document number from chip |
| `chipData.dateOfBirth` | string | yes | Date of birth from chip (YYYYMMDD) |
| `chipData.expiryDate` | string | yes | Expiry date from chip (YYYYMMDD) |
| `chipData.nationality` | string | yes | Nationality code from chip |
| `chipData.surname` | string | yes | Surname from chip |
| `chipData.givenNames` | string | yes | Given names from chip |
| `chipData.issuerAuthority` | string | no | Issuing authority |
| `signatureAlg` | string | no | Signature algorithm (e.g. `SHA256WithRSA`) |
| `certificateIssuer` | string | no | Certificate issuer DN |
| `certificateSubject` | string | no | Certificate subject DN |
| `async` | boolean | no | Set to `true` for async processing |

### Response

```json
{
  "status": "approved",
  "eidStatus": "approved",
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "data": {
    "chipAuthenticated": true,
    "sodSignatureValid": true,
    "documentDataMatch": true,
    "visualDataMatch": true,
    "authenticityScore": 0.97,
    "riskScore": 5
  }
}
```

### Validation Fields

| Field | Type | Description |
|-------|------|-------------|
| `chipAuthenticated` | boolean | Whether the chip was cryptographically authenticated |
| `sodSignatureValid` | boolean | Whether the SOD (Security Object Document) signature was valid |
| `documentDataMatch` | boolean | Whether chip data matches the printed MRZ |
| `visualDataMatch` | boolean | Whether chip data matches the visual inspection zone text |
| `authenticityScore` | number (0–1) | Combined authenticity confidence |
| `riskScore` | number (0–100) | Aggregate risk from eID mismatches |
| `certificateValidAt` | timestamp | When the signing certificate was valid |

## eID NFC Data Model

The verification result is stored in the `EidNfcValidation` model (`eidnfcvalidations` collection):

| Field | Type | Description |
|-------|------|-------------|
| `status` | enum | `APPROVED`, `REJECTED`, `FAILED`, `PENDING` |
| `chipAuthenticated` | boolean | Cryptographic chip authentication |
| `sodSignatureValid` | boolean | SOD signature validity |
| `documentDataMatch` | boolean | Chip ↔ MRZ match |
| `visualDataMatch` | boolean | Chip ↔ visual text match |
| `chipData` | object | Full chip data (document number, DOB, expiry, nationality, surname, given names) |
| `signatureAlg` | string | Signature algorithm |
| `certificateIssuer` | string | Certificate issuer DN |
| `certificateSubject` | string | Certificate subject DN |
| `authenticityScore` | number | 0–1 combined score |
| `riskScore` | number | 0–100 risk |
| `errors` | array | Structured error array |
| `rejectionReasons` | array | Rejection reason strings |
| `provider` | string | Always `eid` |

## Profile Status Integration

eID NFC verification status is stored separately on the profile. The overall profile status calculation incorporates:

- **ID verification** status
- **Selfie verification** status
- **eID NFC verification** status (when performed)
- **Screening** status (when configured)

All required steps must pass for `APPROVED` status.

## Strictness

The eID NFC checkpoint is **strict** — any mismatch between chip data and visual data results in `REJECTED`:

- Chip authentication failure → `REJECTED`
- SOD signature invalid → `REJECTED`
- Document data mismatch → `REJECTED`
- Visual data mismatch → `REJECTED`

## Prerequisites for Mobile Integration

- NFC-capable device (iOS 13+, Android 7+)
- eID card with active chip (most national eIDs from 2017+)
- Mobile app with NFC reading capability
- eID chip data must be extracted client-side and submitted to Armith

## Idempotency

eID NFC check supports `Idempotency-Key` header — same key + same body within 24h returns cached response.
