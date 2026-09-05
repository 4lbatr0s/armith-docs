# Verification Workflows

Armith supports **configurable verification workflows** — ordered sequences of verification steps that tenants can define per use case. Workflows allow you to control which verification steps run, in what order, and whether each step is required or optional.

## Workflow Model

Each workflow consists of an ordered list of steps:

```json
{
  "steps": [
    { "id": "id-1", "type": "id", "required": true },
    { "id": "selfie-1", "type": "selfie", "required": true },
    { "id": "screening-1", "type": "screening", "required": false }
  ]
}
```

### Step Types

| Type | Description |
|------|-------------|
| `id` | ID card verification |
| `selfie` | Selfie/face match verification |
| `screening` | AML/sanctions/PEP screening |
| `manual_review` | Manual review gate |

### Step Properties

| Property | Description |
|----------|-------------|
| `id` | Unique step identifier within the workflow |
| `type` | Step type (from the table above) |
| `required` | Whether the step must pass for overall approval |

## Default Workflow

Every tenant has a default workflow. The default is used when no explicit workflow is specified for a profile. The default workflow is:

1. **ID card verification** (required)
2. **Selfie verification** (required)
3. **Screening** (optional — only runs when configured)

## API

### List workflows

```bash
curl -X GET "https://armith-backend-live.onrender.com/admin/workflows" \
  -H "Authorization: Bearer <CLERK_JWT>"
```

### Create/update workflow

```bash
curl -X PUT "https://armith-backend-live.onrender.com/admin/workflows" \
  -H "Authorization: Bearer <CLERK_JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "high-security-onboarding",
    "name": "High Security Onboarding",
    "steps": [
      { "id": "id-1", "type": "id", "required": true },
      { "id": "selfie-1", "type": "selfie", "required": true },
      { "id": "screening-1", "type": "screening", "required": true },
      { "id": "review-1", "type": "manual_review", "required": true }
    ],
    "isDefault": false
  }'
```

### Upsert behavior

- If `workflowId` exists → updates the workflow
- If `workflowId` is new → creates the workflow
- Setting `isDefault: true` updates the tenant's default workflow

## Workflow Execution

When a verification starts:

1. The system loads the tenant's workflow (or uses the default)
2. Steps are executed **in order**
3. **Required steps** must all pass for `APPROVED`
4. **Optional steps** that fail do not block approval
5. The workflow completes when all steps have been attempted

### Status Transitions

```
PENDING → [Step 1] → PENDING → [Step 2] → ... → APPROVED
                              ↓
                          REJECTED (if required step fails)
                              ↓
                      UNDER_REVIEW (if auto-escalation triggers)
```

## Use Cases

### Low-risk onboarding

```json
{
  "steps": [
    { "id": "id-1", "type": "id", "required": true },
    { "id": "selfie-1", "type": "selfie", "required": false }
  ]
}
```

Selfie is optional — users can proceed with ID-only verification.

### Regulated financial onboarding

```json
{
  "steps": [
    { "id": "id-1", "type": "id", "required": true },
    { "id": "selfie-1", "type": "selfie", "required": true },
    { "id": "screening-1", "type": "screening", "required": true },
    { "id": "review-1", "type": "manual_review", "required": false }
  ]
}
```

Full KYC + AML screening, with optional manual review for escalated cases.

### Business verification

```json
{
  "steps": [
    { "id": "id-director-1", "type": "id", "required": true },
    { "id": "selfie-director-1", "type": "selfie", "required": true },
    { "id": "screening-director-1", "type": "screening", "required": true }
  ]
}
```

## Workflow vs Verification Steps Setting

Runtime verification still uses tenant **`verificationSteps`** (`requireIdCard`, `requireSelfie`, `requireAml`). The workflows API stores an ordered admin overlay (`GET`/`PUT /admin/workflows`). If a workflow exists it should be treated as documentation of intended order; **`verificationSteps` remains the flags the pipeline actually evaluates**. Do not configure the two in conflict.

## Best Practices

1. **Define workflows for each use case** — onboarding, transaction, business verification
2. **Name workflows descriptively** — `high-security-onboarding`, `low-risk-identity-check`
3. **Keep the default workflow simple** — most profiles should use the default
4. **Use required steps sparingly** — mark steps as optional unless legally required
5. **Log workflow execution** — store `workflowId` with profile records for audit
