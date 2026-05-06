# Armith KYC API Documentation

Armith is an **API-only** KYC platform.

<script setup>
const appUrl = import.meta.env.VITE_APP_URL || 'https://armith.onrender.com';
</script>

<a :href="appUrl" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:12px 0;padding:10px 14px;border:1px solid #888;border-radius:6px;text-decoration:none;">
  Uygulamaya Git
</a>

- We currently support KYC flows through **REST API endpoints**
- We do **not** provide SDKs at this stage
- You can integrate from any backend or frontend stack that can call HTTP APIs

## What This Documentation Covers

1. Generate API key from dashboard
2. Authenticate API requests correctly
3. Complete KYC flow endpoint by endpoint
4. Validate responses and handle outcomes
5. Use live REST playground to send real requests

## Base URL

Use your assigned API base URL:

- Sandbox: `https://armith-backend-live.onrender.com`
- Production: `https://api.armith.com`

Ask Armith support for your tenant base URL if your account uses a dedicated domain.

## Supported KYC Pattern (Current)

The current implementation is built around this API flow:

1. Sign in to dashboard and create API key
2. Request pre-signed upload URLs
3. Upload ID and selfie images to object storage
4. Run ID verification
5. Run selfie verification
6. Query profile status

## Recommended Reading Order (Domino Flow)

1. `Getting Started`
2. `Authentication`
3. `Flow Overview`
4. `Step-by-Step API Flow`
5. `Statuses and Errors`
6. `REST API Playground`
