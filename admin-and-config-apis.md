# Admin and Config APIs

This section describes non-core-flow endpoints used for operations and rule management.

## Admin Endpoints

Base path: `/admin`

All admin endpoints are authenticated.

## 1) List verifications

`GET /admin/verifications?page=1&limit=10&status=APPROVED`

Purpose:

- Paginated list of verification profiles and metadata for dashboard use.

## 2) Verification statistics

`GET /admin/stats`

Purpose:

- Aggregate counters such as approved/rejected/pending and approval rate.

## 3) Read settings

`GET /admin/settings`

Purpose:

- Returns active verification rules and threshold settings.

## 4) Update settings

`PUT /admin/settings`

Purpose:

- Update verification rule switches and threshold values.

## 5) Reset settings

`POST /admin/settings/reset`

Purpose:

- Reset settings to default preset values.

---

## Config Endpoints

Base path: `/config`

These endpoints rely on authenticated user context (`req.auth.userId`) and are intended for user-scoped KYC configuration workflows.

## 1) Get config

`GET /config`

Returns user config; creates default if none exists.

## 2) Get presets

`GET /config/presets`

Returns available preset definitions.

## 3) Update config (partial)

`PATCH /config`

Applies partial updates to nested config fields.

## 4) Apply preset

`POST /config/preset`

Sets active config based on chosen preset key.
