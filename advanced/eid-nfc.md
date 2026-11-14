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

   The chip must be **bound to the person**: at least a document identifier (serial or TC number), the date of birth and a name must have been compared. Run the ID-card check first so the profile has them. A profile with too little card-face data cannot be approved from a chip alone (`VISUAL_DATA_MISSING`, `UNDER_REVIEW`), because a genuine chip of anyone would otherwise match "nothing".

Passive Authentication proves the data is what the issuing country signed. It **cannot detect a cloned chip** (genuine data copied to another chip). That is what **Active Authentication** is for: the chip signs a challenge that Armith chose, with a private key that never leaves the chip. A clone has the data but not the key.

A result that passes every check **and** includes a valid Active Authentication proof is `APPROVED` with `chipAuthenticated: true`. Without the proof it is `UNDER_REVIEW` with `CLONE_DETECTION_NOT_PERFORMED`; an operator who accepts that risk can set `EID_ALLOW_PASSIVE_ONLY=1`.

## Active Authentication

1. **Ask for a challenge**, then tap the card:

```bash
curl -X POST "$BASE/kyc/eid-challenge" -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"profileId": "<ID>"}'
# {"challengeId": "...", "challenge": "<base64, 8 bytes>", "expiresAt": "...", "expiresInSeconds": 120}
```

2. Send the 8 bytes to the chip with `INTERNAL AUTHENTICATE` (ISO 7816-4) and keep its answer.
3. **Upload** it with the other files:

```json
{ "profileId": "<ID>", "chip": { "sod": "...", "dataGroups": { "1": "...", "2": "...", "14": "...", "15": "..." },
  "activeAuthentication": { "challengeId": "<from step 1>", "signature": "<base64 of the chip's response>" } } }
```

The challenge is valid for **two minutes**, for **that profile only**, and is **spent by the first upload that uses it**, whatever the verdict. Reusing, replaying or presenting an expired or foreign challenge is `400 CHALLENGE_INVALID`: ask for a new one. A profile can hold at most five open challenges (`429 TOO_MANY_CHALLENGES`).

DG15 (the Active Authentication public key) must be sent, and its hash must have passed passive authentication, otherwise the key is not trusted and the check is skipped. A signature that does not verify against it is `REJECTED` with `ACTIVE_AUTH_SIGNATURE_INVALID` (a cloned chip). ECDSA (hash from DG14, default SHA-256) and RSA (ISO/IEC 9796-2 scheme 1) are supported. A chip without DG15 simply cannot prove it holds a key and stays `UNDER_REVIEW`.

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
| `APPROVED` | Every check passes **and** Active Authentication succeeded (or passive-only is allowed with `EID_ALLOW_PASSIVE_ONLY=1`). |
| `UNDER_REVIEW` | All checks pass but clone detection was not performed, **or** the profile has too little card-face data to bind the chip to the person (`VISUAL_DATA_MISSING`), **or** no CSCA trust anchors are configured (`NO_TRUST_ANCHORS`, a configuration gap, not the applicant's fault). |
| `REJECTED` | Evidence of tampering or a different person: `SOD_SIGNATURE_INVALID`, `SOD_CHAIN_UNTRUSTED`, `DG_HASH_MISMATCH`, `DG_NOT_IN_SOD`, `ACTIVE_AUTH_SIGNATURE_INVALID`, `MRZ_CHECK_DIGIT_INVALID`, `CHIP_VISUAL_MISMATCH`, `DOCUMENT_EXPIRED`. |
| `FAILED` | A bad read; ask the user to tap again: `SOD_MALFORMED`, `DG1_MALFORMED`, `DG_MISSING_REQUIRED`, `ACTIVE_AUTH_KEY_MISSING`. Malformed uploads are a `400` (`MISSING_CHIP_DATA`, `CHIP_PAYLOAD_INVALID`). |

## Operator setup

Set `EID_CSCA_DIR` to a directory of **CSCA certificates** (PEM or DER: `.pem .crt .cer .der`) obtained from the issuing countries or the ICAO PKD. Only CA certificates are loaded; the directory is re-read every ten minutes. With no directory, nothing is trusted and results are held for review. A document signer's own expiry is only a warning (`DOCUMENT_SIGNER_EXPIRED`); the CSCA must be valid today.

Revocation (CRLs) is not checked yet.
