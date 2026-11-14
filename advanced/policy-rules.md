# Advanced: Policy rules

Rules let you say, in plain terms, "when a case looks like this, hold it for review or reject it". They sit in a
[workflow](/advanced/custom-workflows), are readable by a regulator, and are explainable: every match records the rule
and its reason on the case.

## What a rule is

```json
{
  "id": "high-risk-de",
  "name": "High risk in Germany",
  "enabled": true,
  "when": { "all": [
    { "signal": "country", "op": "eq", "value": "DE" },
    { "signal": "riskScore", "op": "gte", "value": 60 }
  ]},
  "then": { "action": "route_to_review", "reason": "German case with a high risk score" }
}
```

- `when` has exactly one of `all` (every condition) or `any` (at least one), with 1 to 6 conditions.
- `then.action`: `route_to_review` (hold for a person), `reject`, or `flag` (record only, change nothing).
- `then.reason`: 3 to 200 characters, in plain words. Reviewers and the audit trail read it.
- Up to 25 rules per workflow. There is no code evaluation: conditions are data over a fixed list of signals.

## Signals

| Signal | Type | Meaning |
|---|---|---|
| `country` | text | ISO country code of the applicant |
| `riskScore` | number | 0-100 risk score from the checks |
| `idStatus`, `selfieStatus` | text | Status of the ID and selfie checks |
| `faceMatchCosine` | number | Selfie vs ID similarity, 0-1 (only when scored on the cosine scale) |
| `spoofingRisk` | number | 0-1 |
| `chipRead` | yes/no | An NFC chip was read |
| `chipAuthentic` | yes/no | The chip passed server-side authenticity checks |
| `chipPhotoMatch` | yes/no | The chip photo matches the selfie |
| `ageYears` | number | Whole years by the calendar (on the birthday the person has just turned the age) |
| `documentDaysToExpiry` | number | Days until the document expires |
| `amlStatus`, `amlHitCount` | text, number | AML screening status and number of hits |

Operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte` (numbers only), `in`, `nin` (a list of up to 20 values), `exists`.
An **unknown** value (for example no chip was read, so `chipAuthentic` is unknown) never satisfies a comparison; ask
about it explicitly with `exists`. `GET /admin/workflows/rule-catalog` lists the signals, operators, actions and limits.

## Rules only tighten

- `APPROVED` can become `UNDER_REVIEW` (hold) or `REJECTED` (reject).
- `UNDER_REVIEW` can become `REJECTED`.
- Nothing else changes, and **no rule can ever approve a case**. Reject beats hold beats flag.
- A case a rule has held stays held: a later automatic step (for example AML finishing) never releases it, even if you
  edit the rules afterwards. A person resolves it.
- If the rules cannot be evaluated (a database problem), an approval is held for review rather than let through.

The rules run on every path that stores a final status: after the ID check (ID-only workflows), after the selfie check,
and when AML screening finishes. Each match is recorded on the case (`policyMatches`) and in its timeline with the
workflow version.

## Publishing safely

1. `PUT /admin/workflows` with `rules`. Rules are validated (an invalid rule returns `400 INVALID_RULES` saying why);
   omit `rules` to keep the current ones, send `[]` to clear them.
2. Every change bumps the workflow `version`; every version is kept (`GET /admin/workflows/{id}/revisions`), so a
   decision can be traced to the exact rules in force.
3. Before publishing, `POST /admin/workflows/preview` with `{ "rules": [...] }` answers "what would these rules have
   done to my last cases?": counts of would-be holds and rejections, matches per rule, and a few example case ids.
   It is read-only.

The dashboard has a **Policy rules** tab (admin) that does all of this visually.
