# Advanced: Custom Workflows

Order verification steps per tenant via `PATCH /config`:

```json
{"steps": [
  {"id": "id-1", "type": "id", "required": true},
  {"id": "selfie-1", "type": "selfie", "required": true},
  {"id": "screening-1", "type": "screening", "required": false}
]}
```

Optional steps (`required: false`) never block `APPROVED`. The older flat `verificationSteps` (require ID/selfie, AND/OR) still works for simple cases — use `steps` only when you need ordering or optionality. Stamp a workflow on hosted capture with `workflowId` on `POST /kyc/profiles` / `POST /kyc/hosted-sessions`. Validate with sandbox `under_review` + screening scenarios before rolling out. Video Ident is not a workflow step.