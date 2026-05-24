# Armith Docs

Product documentation for the Armith API-only KYC platform.

**Live site:** https://armith-docs-standalone.onrender.com

## Local development

```bash
npm install
npm run docs:dev
```

## Build

```bash
npm run docs:build
npm run docs:preview
```

## Environment

Copy `.env.example` to `.env` and set `VITE_APP_URL` (dashboard link on home page).

## Documentation structure

| Page | Topic |
|------|--------|
| `index.md` | Overview and reading order |
| `getting-started.md` | Prerequisites and checklist |
| `authentication.md` | API keys, Clerk, capture sessions, idempotency |
| `integrations-dashboard.md` | Webhooks + API keys UI |
| `kyc-flow-overview.md` | End-to-end pipeline |
| `kyc-api-flow.md` | Step-by-step curl guide |
| `verification-and-preflight.md` | Blur, adversarial checks, thresholds |
| `webhooks.md` | Outbound events and signing |
| `errors-and-statuses.md` | Status codes and error families |
| `admin-and-config-apis.md` | Admin + `/config` reference |
| `api-reference.md` | REST playground |

OpenAPI: `public/openapi.yaml`  
Playground catalog: `playground-endpoints.js`
