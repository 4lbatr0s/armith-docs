# Advanced: eID NFC Verification

Cryptographic check of the chip in an eID card or passport. Your mobile app reads the chip over NFC and uploads the **raw chip files**; Armith verifies them on the server. Nothing the client says about authenticity is read: `chipAuthenticated`, `sodSignatureValid` and similar flags are refused (`400 CHIP_ATTESTATION_NOT_ACCEPTED`).

The endpoint returns a result and stores it, but does not (yet) change the profile status. `async` mode is not supported.

## Request

```bash
curl -X POST "$BASE/kyc/eid-check" -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: eid-<profileId>" \
  -d '{
    "profileId": "<ID>",
    "countryCode": "TR",
    "chip": {
      "sod": "<base64 of EF.SOD>",
      "dataGroups": { "1": "<base64 of EF.DG1>", "2": "<base64 of EF.DG2>", "14": "...", "15": "..." }
    }
  }'
```

- `sod`: the EF.SOD file, with or without its `0x77` wrapper.
- `dataGroups`: every data group your SDK read, keyed by number (1–16). **DG1 and DG2 are required.** Each file at most 256 KB, 512 KB in total.
- Read the files exactly as the chip returns them; do not re-encode or crop the photo.

## What the server checks

1. **Passive Authentication (ICAO 9303).** EF.SOD is a signed Security Object. The server verifies its signature, checks that the Document Signer certificate chains to a trusted country CSCA, and re-hashes every data group you sent against the signed hashes.
2. **DG1.** The chip's copy of the MRZ is parsed and its check digits verified.
3. **Chip vs. card.** DG1 is compared with the profile (card face): serial number, TC Kimlik No (from the MRZ optional field), date of birth, expiry date and name. The document must not be expired.

Passive Authentication proves the data is what the issuing country signed. It **cannot detect a cloned chip** (genuine data copied to another chip). Until Active/Chip Authentication is supported, a result that passes every check is `UNDER_REVIEW` with `CLONE_DETECTION_NOT_PERFORMED`. An operator who accepts that risk can set `EID_ALLOW_PASSIVE_ONLY=1` to get `APPROVED`.

## Response

```json
{
  "status": "UNDER_REVIEW",
  "chipAuthenticated": false,
  "sodSignatureValid": true,
  "certificateChainValid": true,
  "dataGroupHashesValid": true,
  "documentDataMatch": true,
  "visualDataMatch": true,
  "documentSignerCountry": "TR",
  "authenticityScore": 1,
  "riskScore": 10,
  "errors": [{ "textCode": "CLONE_DETECTION_NOT_PERFORMED", "severity": "warning" }],
  "validationId": "..."
}
```

The response never contains personal data: errors name a code and, for mismatches, the field (`field: "identityNumber"`), never the value. The raw files are not stored; only the SHA-256 of EF.SOD is kept as evidence, and the extracted fields are stored encrypted.

## Outcomes

| Status | When |
|---|---|
| `APPROVED` | Every check passes **and** passive-only is allowed (`EID_ALLOW_PASSIVE_ONLY=1`). |
| `UNDER_REVIEW` | All checks pass but clone detection was not performed, **or** no CSCA trust anchors are configured (`NO_TRUST_ANCHORS`, a configuration gap, not the applicant's fault). |
| `REJECTED` | Evidence of tampering or a different person: `SOD_SIGNATURE_INVALID`, `SOD_CHAIN_UNTRUSTED`, `DG_HASH_MISMATCH`, `DG_NOT_IN_SOD`, `MRZ_CHECK_DIGIT_INVALID`, `CHIP_VISUAL_MISMATCH`, `DOCUMENT_EXPIRED`. |
| `FAILED` | A bad read; ask the user to tap again: `SOD_MALFORMED`, `DG1_MALFORMED`, `DG_MISSING_REQUIRED`. Malformed uploads are a `400` (`MISSING_CHIP_DATA`, `CHIP_PAYLOAD_INVALID`). |

## Operator setup

Set `EID_CSCA_DIR` to a directory of **CSCA certificates** (PEM or DER: `.pem .crt .cer .der`) obtained from the issuing countries or the ICAO PKD. Only CA certificates are loaded; the directory is re-read every ten minutes. With no directory, nothing is trusted and results are held for review. A document signer's own expiry is only a warning (`DOCUMENT_SIGNER_EXPIRED`); the CSCA must be valid today.

Revocation (CRLs) is not checked yet.
