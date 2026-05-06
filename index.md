# Armith KYC API Documentation

Armith is an **API-only** KYC platform.

- We currently support KYC flows through **REST API endpoints**
- We do **not** provide SDKs at this stage
- You can integrate from any backend or frontend stack that can call HTTP APIs

## What This Documentation Covers

1. How to authenticate requests
2. How to create/manage API keys from the dashboard
3. How to run the end-to-end KYC flow with API endpoints
4. What each endpoint returns
5. How to interpret statuses and error codes
6. How to use admin and config endpoints
7. Interactive REST API component for endpoint exploration

## Base URL

Use your environment-specific backend URL:

- Local: `http://localhost:3001`
- Development (Render): `https://armith-backend-live.onrender.com`

## Supported KYC Pattern (Current)

The current implementation is built around this API flow:

1. Sign in to dashboard and create API key
2. Request pre-signed upload URLs
3. Upload ID and selfie images to object storage
4. Run ID verification
5. Run selfie verification
6. Query profile status

## Recommended Reading Order

1. `Getting Started`
2. `Authentication`
3. `Flow Overview`
4. `Step-by-Step API Flow`
5. `REST API Component`
