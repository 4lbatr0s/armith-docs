# Armith Docs

Product documentation for the Armith API-first KYC platform.

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

Copy `.env.example` to `.env`. `VITE_APP_URL` is the dashboard link on the home page. Optional `VITE_BACKEND_URL` sets the REST playground default (otherwise sandbox).

## Documentation structure

| Section | Pages |
|---------|-------|
| Start Here | `index.md`, `quickstart.md`, `concepts/` (how-it-works, integration-patterns, terminology) |
| Guides | `guides/rest-api/`, `guides/hosted-capture/`, `guides/mobile-sdk/`, `guides/webhooks/` |
| Reference | `reference/` (authentication, status-codes, configuration, sandbox-testing, limits-and-quotas), `api-reference.md` (REST playground) |
| Advanced | `advanced/` (threshold-tuning, custom-workflows, async-verification, screening, eid-nfc, kyb-verification, manual-review, data-subject-rights) |
| Troubleshooting | `troubleshooting/` (common-errors, faq, debugging-guide) |
| Archive | `archive/` (superseded pages, kept for history — not in sidebar) |

OpenAPI: `public/openapi.yaml`
Playground catalog: `playground-endpoints.js`

Related application repo: **armith**.
