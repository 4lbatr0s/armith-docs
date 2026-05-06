# Getting Started

This page helps you go from zero to your first successful KYC verification request.

## 1) Prerequisites

Before calling Armith APIs, make sure you have:

- A valid Armith backend base URL
- A dashboard user account (for admin panel access)
- An API key generated from dashboard settings (for direct API access)
- Ability to send `x-api-key: <api_key>` headers
- Ability to upload binary files to pre-signed URLs

## 2) Choose Environment

Use one base URL per environment.

### Local

`http://localhost:3001`

### Development

`https://armith-backend-live.onrender.com`

## 3) Authentication Model

KYC endpoints support two auth modes:

1. API key (recommended for production API integrations)
2. User auth token from dashboard session (used by Armith dashboard)

Public endpoints:

- `GET /health`
- `GET /kyc/countries`
- `GET /kyc/llm-status`

Protected examples:

- `POST /kyc/upload-url`
- `POST /kyc/id-check`
- `POST /kyc/selfie-check`
- `GET /kyc/status/:profileId`

## 4) Minimal Integration Checklist

1. Sign in to dashboard and create an API key from settings
2. Call `POST /kyc/upload-url` for each required file
3. Upload files directly to storage using returned pre-signed URL(s)
4. Call `POST /kyc/id-check`
5. Call `POST /kyc/selfie-check` with `profileId`
6. Call `GET /kyc/status/:profileId` to get final state

## 5) First Health Checks

You can verify service availability with:

```bash
curl -X GET "https://armith-backend-live.onrender.com/health"
```

```bash
curl -X GET "https://armith-backend-live.onrender.com/kyc/countries"
```

## 6) Important Constraints

- API-first only: no official SDK right now
- API keys are shown once at creation time; store them securely
- Image URLs must be valid and accessible by backend verification logic
- If your active rules require both ID + selfie, `profileId` is mandatory for selfie step
- CORS and auth must be configured correctly per environment
