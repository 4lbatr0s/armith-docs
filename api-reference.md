---
outline: deep
---

# REST API Playground

Send real HTTP requests from this documentation site. **All endpoints are listed by section** — click one to load **method**, **path**, **request body**, and **documented responses** (similar to Postman / API explorers).

> **Base URLs:** Sandbox — `https://armith-backend-live.onrender.com` · Production — `https://api.armith.com`  
> **OpenAPI:** [`/openapi.yaml`](/openapi.yaml)

### Authentication modes

| Mode | Headers | Used for |
|------|---------|-----------|
| **None** | — | `/health`, public KYC metadata |
| **API key + optional Clerk** | `x-api-key: ak_live_…` **or** `Authorization: Bearer ak_live_…` | `/kyc/*` protected routes |
| **Clerk JWT** | `Authorization: Bearer <dashboard session JWT>` | `/auth/profile`, `/admin/*`, `/config` (excluding `GET /config/presets`) |

Paste a JWT from browser devtools (dashboard `Fetch`/`XHR` Authorization header). API keys belong in **`x-api-key`** or Bearer `ak_live_…`.

Browsers enforce **CORS** — the backend must allow this docs origin (`Access-Control-Allow-Origin`) and **`x-api-key`** on preflight requests.

<RestApiPlayground />
