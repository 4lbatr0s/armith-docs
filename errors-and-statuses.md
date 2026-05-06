# Statuses and Errors

This page helps you interpret responses from KYC endpoints.

## Status Values

Armith uses these status values in verification responses:

- `approved`
- `rejected`
- `pending`
- `failed`

## How to Read Them

### `approved`

Validation passed for required checks.

### `pending`

A required next step is still missing (for example ID done, selfie pending).

### `rejected`

Validation completed but one or more business/security checks failed.

### `failed`

System/runtime issue (service-level failure, not a business rejection).

## Error Object Shape

Many endpoints return structured errors as:

```json
{
  "code": "TEXT_CODE",
  "numericCode": 4001,
  "message": "Human readable error message",
  "field": "optional-field"
}
```

## Error Families (Numeric Code Ranges)

- `1xxx`: Missing mandatory ID data
- `2xxx`: Invalid document data / logic
- `3xxx`: Document image/content quality issues
- `4xxx`: Selfie and liveness/match issues
- `5xxx`: System/runtime problems
- `6xxx`: Flow/precondition/configuration issues

## Typical Integration Behavior

### On `PLAN_LIMIT_REACHED`

- Return user to plan/upgrade step in your product
- Do not retry verification request until quota resets or plan changes

### On `4xx` with validation errors

- Show clear user guidance
- Ask user to re-upload better images

### On `401/403`

- Verify that your API key is present and not revoked
- Rotate key in `Profile -> Security` if needed

### On `5xx` or `failed`

- Retry safely for idempotent operations where suitable
- Log full request/response context for support diagnostics

## High-Value UX Tips

- Always show user-friendly error messages, not raw payload only
- Preserve `profileId` and backend error IDs in logs
- Keep retry loops bounded to avoid duplicate verification storms
