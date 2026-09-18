# Advanced: eID NFC Verification

**Preview.** Chip authenticity is caller-attested until server NFC exists — do not treat as production-grade.

Cryptographic chip check for eID documents. Your mobile app reads the chip via NFC, Armith validates it against visual data.

```bash
curl -X POST "$BASE/kyc/eid-check" -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: eid-<profileId>" \
  -d '{"profileId": "<ID>", "countryCode": "TR",
       "chipData": {"documentNumber": "U12345678", "dateOfBirth": "19900101", "expiryDate": "20300101",
                    "nationality": "TUR", "surname": "LOVELACE", "givenNames": "ADA"},
       "signatureAlg": "SHA256WithRSA", "certificateIssuer": "CN=TR-ID-Signing-CA",
       "certificateSubject": "CN=TR-ID-CHIP-U12345678"}'
```

Server validates chip auth + SOD signature + chip-vs-visual match → combined authenticity score. **Strict: any mismatch rejects.** Errors (7xxx): `MISSING_CHIP_DATA` (7001) → retry NFC tap · `SOD_SIGNATURE_INVALID` (7002) → possible tampering · `CHIP_VISUAL_MISMATCH` (7003) → manual review.
