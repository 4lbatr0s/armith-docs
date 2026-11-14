# Advanced: Sovereign mode

Read ID documents without sending anything to a third-party AI provider. Intended for deployments where applicant data must stay inside your own infrastructure or country.

## Switch it on

```
SOVEREIGN_EXTRACTION=1          # whole deployment
```

or the tenant feature flag `verificationFeatures.sovereignExtraction`.

## How it works

1. The local OCR service (the biometrics sidecar, Tesseract) reads the machine-readable zone (MRZ).
2. The MRZ is accepted only when its **check digits are valid**.
3. The extraction (names, dates, document number, nationality) is built from the MRZ; a front-of-card number read with high confidence (for example the Turkish national number) takes precedence over the MRZ document number.
4. If the MRZ cannot be read or fails its checksum, the applicant is asked to retake the photo (`MRZ_NOT_READABLE`, retryable). Nothing is guessed and nothing reaches an AI provider.

## What it cannot do

Local reading cannot judge the physical document: tampering, hologram, or a screen or print replay. Those results therefore always carry the warning `LOCAL_EXTRACTION_NO_VISUAL_AUTHENTICITY` and go to **human review**; they are never auto-approved. The strongest evidence in this mode is the NFC chip check, which is verified on your server ([eID NFC](/advanced/eid-nfc)). Face match and liveness already run locally on the biometrics service.

## What still goes where

| Step | Sovereign mode |
|---|---|
| ID reading | Local (OCR + MRZ) |
| Face match, liveness | Local (biometrics service) |
| NFC chip verification | Your server |
| Reviewer AI briefing, AI voice agent | Off unless you enable them; they use an AI provider |
