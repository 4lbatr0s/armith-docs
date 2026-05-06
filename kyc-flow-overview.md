# KYC Flow Overview

This page explains the current Armith KYC flow at a high level.

## Current Product Scope

Armith currently supports:

- REST API-based verification flows

Armith currently does not support:

- Official client SDKs
- Drop-in UI widgets

## End-to-End Flow

### Step 1: Discover rules and capabilities

- Check supported countries: `GET /kyc/countries`
- Optionally inspect service state: `GET /kyc/llm-status`

### Step 2: Generate upload URL(s)

Call `POST /kyc/upload-url` for:

- ID front image
- ID back image (if needed)
- Selfie image

### Step 3: Upload files to storage

Use returned pre-signed upload URL and upload the file bytes.

### Step 4: Verify ID

Call `POST /kyc/id-check` with uploaded image URL(s).

Main output:

- `profileId` (important for next steps)
- `status` and `idStatus`
- extracted fields + confidence scores

### Step 5: Verify selfie

Call `POST /kyc/selfie-check` with:

- `idPhotoUrl`
- `selfieUrls`
- `profileId` (required when both ID and selfie are required by rules)

### Step 6: Query verification status

Call `GET /kyc/status/:profileId` for consolidated profile state.

## Status Model

Primary statuses:

- `approved`
- `rejected`
- `pending`
- `failed`

Notes:

- `pending` can happen after ID step when selfie is still required
- `failed` generally indicates system/runtime failure
- `rejected` means business validation was not met
