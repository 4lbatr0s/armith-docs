# Advanced: Data subject rights

Armith lets a tenant administrator export and erase one person's verification data, to answer access and deletion requests (GDPR, KVKK). Both operations are in the dashboard API (`/admin/data-subject/…`), need an **admin** role (organisation admin or owner inside an organisation) and are written to the audit log with the person who acted.

## Export

```bash
GET /admin/data-subject/:profileId/export
```

Returns the profile (decrypted), the consent record, the latest ID-card, selfie and NFC chip validation records and the case timeline:

```json
{ "status": "ok", "export": { "profile": {}, "consent": {}, "idCardValidation": {}, "selfieValidation": {}, "eidNfcValidation": {}, "timeline": [] } }
```

## Erasure

```bash
DELETE /admin/data-subject/:profileId
```

Erases the stored personal data and marks the profile `FAILED`:

- the profile: names, identity number, date of birth, email, phone, serial number, address, expiry date;
- the extracted ID-card data (including the MRZ and the model's reasoning text) and the NFC chip data;
- stored webhook bodies for that profile (the delivery log row itself is kept);
- the stored images and recordings, when `ADMIN_DELETE_PURGE_OBJECTS=1`.

Erasure removes the fields; it does not overwrite them with a placeholder. It is repeatable: if it is interrupted it can be run again, and the profile is only marked as anonymised once everything else has been erased.

**What remains** (no personal data): the status, scores and error codes, the timeline, audit events, and the SHA-256 of the chip's EF.SOD.

A profile under **legal hold** cannot be erased: the call returns `409 LEGAL_HOLD`.

## How data is protected at rest

Names, identity numbers, dates of birth, contact details, ID-card and chip data, sanctions-screening hits, stored webhook bodies and cached idempotent responses are encrypted per tenant (AES-256-GCM, keys held in a key manager). Lookups by identity number or name use keyed hashes, so search is exact-match only. Webhook signing keys are encrypted too.

## Retention

Production will not start without an explicit decision about stored media: either a scheduled purge after a number of days (`R2_RETENTION_MIN_AGE_DAYS`, at least 7) or keeping media on purpose (`R2_RETENTION_KEEP_FOREVER`), for example where a regulator requires it. Choose the period with your legal advisers; some regulated activities require records to be kept for years.
