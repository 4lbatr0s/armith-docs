# Advanced: Custom Workflows

Order verification steps per tenant with `PUT /admin/workflows` (Clerk auth, `admin` role). This is an upsert keyed by `workflowId`:

```json
{
  "workflowId": "kyc-with-aml",
  "name": "KYC with AML screening",
  "isDefault": true,
  "steps": [
    {"id": "id-1", "type": "id", "required": true},
    {"id": "selfie-1", "type": "selfie", "required": true},
    {"id": "screening-1", "type": "screening", "required": false}
  ]
}
```

Rules: `workflowId` is 1–64 characters of letters, digits, `_` or `-`; `steps` has 1–12 items with unique `id`s; `type` is one of `id`, `selfie`, `videocall`, `screening`, `manual_review`; at most one workflow per tenant is `isDefault` (setting it clears the others). Invalid payloads return `400 INVALID_INPUT` with the reason.

Optional steps (`required: false`) never block `APPROVED`. The flat `verificationSteps` on `PATCH /config` (require ID/selfie/AML) still works for simple cases; use workflows when you need ordering or optionality. Stamp a workflow on hosted capture with `workflowId` on `POST /kyc/profiles` / `POST /kyc/hosted-sessions`. List with `GET /admin/workflows`. Validate with sandbox `under_review` + screening scenarios before rolling out. Video Ident is not a workflow step.
