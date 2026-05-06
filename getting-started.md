# Getting Started

This guide helps you move from account activation to your first successful verification in production-style conditions.

## 1) Prerequisites

Before calling Armith APIs, make sure you have:

- An active Armith account
- Dashboard access for your team member
- An API key created in `Profile -> Security`
- Your assigned API base URL
- Ability to send `x-api-key: <api_key>` headers from your backend
- Ability to upload binary files to pre-signed URLs

## 2) Choose Environment

Use one base URL per environment.

### Sandbox

`https://sandbox-api.armith.com`

### Production

`https://api.armith.com`

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

1. Sign in to dashboard and open `Profile -> Security`
2. Create API key and store it in your secret manager
2. Call `POST /kyc/upload-url` for each required file
3. Upload files directly to storage using returned pre-signed URL(s)
4. Call `POST /kyc/id-check`
5. Call `POST /kyc/selfie-check` with `profileId`
6. Call `GET /kyc/status/:profileId` to get final state

## 5) First Health Checks

You can verify service availability with:

```bash
curl -X GET "https://api.armith.com/health"
```

```bash
curl -X GET "https://api.armith.com/kyc/countries"
```

## 6) Important Constraints

- API-first only: no official SDK right now
- API keys are shown once at creation time; store them securely
- Image URLs must be valid and accessible by backend verification logic
- If your active rules require both ID + selfie, `profileId` is mandatory for selfie step
- CORS and auth must be configured correctly per environment
