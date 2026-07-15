# KYB Verification (Know Your Business)

Armith supports **Know Your Business (KYB)** entity verification — verifying legal entities, their registration details, and their relationship to individual KYC profiles (directors, beneficial owners, shareholders).

## Overview

KYB enables you to:

- Create business entity profiles with legal name, registration number, and jurisdiction
- Link related person KYC profiles (directors, UBOs)
- Track entity verification status
- Perform business-to-person relationship mapping

## API Endpoints

All KYB endpoints accept either API key authentication or Clerk session.

### Create KYB profile

```bash
curl -X POST "https://armith-backend-live.onrender.com/kyb/profiles" \
  -H "x-api-key: ak_live_<YOUR_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Acme Corp Ltd.",
    "registrationNumber": "1234567890",
    "jurisdiction": "GB",
    "relatedPersonProfileIds": [
      "672a9c2e3f1b2c4d5e6f7890"
    ],
    "metadata": {
      "industry": "fintech",
      "entityType": "limited"
    }
  }'
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `legalName` | string | yes | Legal entity name |
| `registrationNumber` | string | no | Business registration / company number |
| `jurisdiction` | string | no | Jurisdiction of incorporation (ISO country code) |
| `relatedPersonProfileIds` | array | no | Array of KYC profile ObjectIds (directors, UBOs) |
| `metadata` | object | no | Arbitrary key-value metadata |

### Response

```json
{
  "id": "672a9c2e3f1b2c4d5e6f7891",
  "legalName": "Acme Corp Ltd.",
  "registrationNumber": "1234567890",
  "jurisdiction": "GB",
  "status": "PENDING",
  "relatedPersonProfileIds": ["672a9c2e3f1b2c4d5e6f7890"],
  "createdAt": "2026-06-01T12:00:00Z"
}
```

### List KYB profiles

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyb/profiles" \
  -H "x-api-key: ak_live_<YOUR_KEY>"
```

### Get single KYB profile

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyb/profiles/<KYB_PROFILE_ID>" \
  -H "x-api-key: ak_live_<YOUR_KEY>"
```

## Admin KYB Endpoints (Clerk auth)

Clerk-authenticated equivalents for dashboard use:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/kyb/admin/profiles` | List KYB profiles |
| `POST` | `/kyb/admin/profiles` | Create KYB profile |
| `GET` | `/kyb/admin/profiles/:id` | Get single KYB profile |

## KYB Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | ObjectId | Unique profile identifier |
| `tenantUserId` | string | Tenant account ID |
| `legalName` | string | Legal entity name |
| `registrationNumber` | string | Business registration number |
| `jurisdiction` | string | Country of incorporation |
| `status` | enum | `PENDING`, `APPROVED`, `REJECTED`, `UNDER_REVIEW` |
| `relatedPersonProfileIds` | ObjectId[] | References to KYC profiles |
| `metadata` | object | Arbitrary metadata |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last update time |

## Person-to-Business Relationship

KYB profiles link to individual KYC profiles through `relatedPersonProfileIds`. This enables:

- Director verification — verify each director's identity
- Beneficial ownership mapping — identify UBOs
- Business structure documentation — parent/subsidiary relationships

The linked KYC profiles are independent of the KYB profile — each person must complete their own KYC flow (ID + selfie).

## Verification Workflow

KYB verification currently follows a manual or automated review model:

1. **Create KYB profile** with entity details and linked persons
2. **Link verified KYC profiles** for directors/UBOs
3. **Review** entity documentation (future: automated document verification)
4. **Resolve** to `APPROVED` or `REJECTED`

Entity verification status is tracked independently of person KYC status.

## Use Cases

- **Merchant onboarding** — verify the legal entity behind a business account
- **Corporate account opening** — verify directors and UBOs
- **Procurement due diligence** — verify supplier entities
- **Partnership onboarding** — verify partner organizations
