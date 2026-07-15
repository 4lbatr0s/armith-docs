# Data Subject Rights (GDPR)

Armith provides **Data Subject Rights (DSR)** APIs for compliance with data protection regulations including GDPR, KVKK (Turkey), and similar frameworks. These endpoints enable tenant administrators to export or delete personal data associated with a verification profile.

## Prerequisites

- **Authentication:** All DSR endpoints require Clerk session authentication (`/admin/*`)
- **Authorization:** Only the tenant that owns the profile can access its data
- **Legal hold:** Profiles with `legalHold: true` cannot be deleted (export still works)

## Export Profile Data

Export all personal data associated with a verification profile in a machine-readable format.

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/data-subject/<PROFILE_ID>/export" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Response

```json
{
  "profileId": "672a9c2e3f1b2c4d5e6f7890",
  "exportedAt": "2026-06-01T12:00:00Z",
  "profile": {
    "fullName": "Ada Lovelace",
    "firstName": "Ada",
    "lastName": "Lovelace",
    "identityNumber": "12345678901",
    "dateOfBirth": "1815-12-10",
    "nationality": "GB",
    "email": "ada@example.com",
    "status": "APPROVED",
    "createdAt": "2026-05-01T10:00:00Z"
  },
  "idCardValidation": {
    "status": "APPROVED",
    "extractedFields": { ... },
    "confidenceScores": { ... }
  },
  "selfieValidation": {
    "status": "APPROVED",
    "matchConfidence": 96
  },
  "screening": {
    "status": "clear",
    "provider": "opensanctions"
  },
  "timeline": [
    { "type": "id_verification_completed", "createdAt": "2026-05-01T10:01:00Z" },
    { "type": "selfie_verification_completed", "createdAt": "2026-05-01T10:02:00Z" }
  ],
  "webhookDeliveries": [ ... ]
}
```

The export includes:

- Profile data (PII)
- ID card verification results
- Selfie verification results
- eID NFC verification results (if performed)
- Screening results
- Verification timeline (events)
- Webhook delivery log entries

## Delete Profile Data

Anonymize or delete all personal data for a verification profile.

```bash
curl -X DELETE "https://armith-backend-live.onrender.com/admin/data-subject/<PROFILE_ID>" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Behavior

| Condition | Result |
|-----------|--------|
| Profile without `legalHold` | PII is anonymized, verification records are deleted |
| Profile with `legalHold: true` | **Blocked** — returns 409 with explanation |
| Profile not found | 404 |

### What gets deleted

| Data | Action |
|------|--------|
| Profile PII | Anonymized (identity fields set to `[REDACTED]`) |
| ID card validation | Deleted |
| Selfie validation | Deleted |
| eID NFC validation | Deleted |
| Images (R2) | Deleted (purged from storage) |
| Timeline entries | Deleted |
| Webhook deliveries | Anonymized (payloads redacted) |
| Manual review outcomes | Anonymized |
| Dashboard stats | Updated (counts preserved, PII removed) |

### What is retained (non-personal)

| Data | Reason |
|------|--------|
| Aggregated statistics | Not linked to identifiable person |
| Audit log entries | Operational record (non-PII metadata) |
| Billing records | Legal/financial retention requirement |

## Legal Hold

Profiles under legal hold (`legalHold: true`) are protected from deletion:

- DSR delete requests return `409 Conflict`
- R2 lifecycle retention skips these profiles
- Manual override requires direct database access

Set legal hold via the dashboard or direct database update.

## Compliance Notes

### GDPR (EU)

- Right to access: Use [Export API](#export-profile-data)
- Right to erasure: Use [Delete API](#delete-profile-data)
- Response time: Armith processes DSR requests in real-time; your obligation is to respond within 30 days
- Data controller: You (the tenant) are the data controller
- Data processor: Armith is the data processor

### KVKK (Turkey)

- Right to access and deletion are covered by the same APIs
- Data residency: Profiles are stored in the region configured for your tenant (`dataRegion`)
- If your tenant is pinned to `TR` region, all data stays in Turkish data centers

### CCPA (California)

- Right to know: Use Export API
- Right to delete: Use Delete API
- Note: CCPA has exemptions for identity verification data in some contexts

## Audit Trail

All DSR operations are logged in the audit log:

- `data_subject.export` — when an export is performed
- `data_subject.delete` — when a deletion/anonymization is performed

The audit log records: `actorClerkId`, `tenantUserId`, `action`, `targetId`, `timestamp`.

## Best Practices

1. **Implement a DSR request portal** in your application that calls Armith's APIs
2. **Verify user identity** before processing DSR requests (confirm profile ownership)
3. **Log all DSR requests** in your own systems for compliance records
4. **Export before delete** — if a user requests deletion, export their data first
5. **Respect legal holds** — do not delete profiles that are under litigation hold
6. **Set retention policies** — use Armith's lifecycle retention jobs for automated data management
