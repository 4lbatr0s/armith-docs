# Armith KYC API Documentation

Armith is an **API-only** KYC platform with a dashboard for operations, settings, API keys, and webhooks.

<script setup>
const appUrl = import.meta.env.VITE_APP_URL || 'https://armith.onrender.com';
</script>

<a :href="appUrl" target="_blank" rel="noopener noreferrer" class="armith-btn-primary">
  Open dashboard
</a>

- KYC flows run through **REST API endpoints** (no official SDKs yet)
- Integrate from any stack that can send HTTP requests and upload to pre-signed URLs
- Configure thresholds, webhooks, and API keys from the dashboard **Integrations** area

## What This Documentation Covers

1. Create and manage **API keys** (`Integrations → API Keys`)
2. Authenticate KYC requests (`x-api-key`, Clerk session, or capture session token)
3. Complete the upload → ID check → selfie check → status flow
4. Configure **outbound webhooks** with signing keys and optional payload fields
5. Understand **preflight gates** (blur, adversarial image checks) and verification outcomes
6. Use the live **REST API Playground** to inspect requests and responses

## Base URL

Use your assigned API base URL:

- **Sandbox / shared dev backend:** `https://armith-backend-live.onrender.com`
- **Production (when provisioned):** `https://api.armith.com`

Ask Armith support for a dedicated tenant domain if your account uses one.

**Dashboard (SPA):** `https://armith.onrender.com`

## Supported KYC Pattern (Current)

1. Sign in to the dashboard and create an API key under **Integrations → API Keys**
2. (Optional) Register **outbound webhooks** under **Integrations → Webhooks**
3. Request pre-signed upload URLs (`POST /kyc/upload-url`)
4. Upload ID and selfie images directly to object storage (R2)
5. Run ID verification (`POST /kyc/id-check`)
6. Run selfie verification (`POST /kyc/selfie-check`) when required
7. Poll session status (`GET /kyc/status/:profileId` or `GET /kyc/sessions/:id`)
8. Receive terminal events on your webhook endpoint (or poll status)

## Recommended Reading Order

1. [Getting Started](/getting-started)
2. [Authentication](/authentication)
3. [Integrations Dashboard](/integrations-dashboard)
4. [Flow Overview](/kyc-flow-overview)
5. [Step-by-Step API Flow](/kyc-api-flow)
6. [Verification & Preflight](/verification-and-preflight)
7. [Outbound Webhooks](/webhooks)
8. [Statuses and Errors](/errors-and-statuses)
9. [REST API Playground](/api-reference)
