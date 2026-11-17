# Pricing and billing rules

Armith bills **per success**. There is no monthly minimum and no contract. The current price list is on the pricing page in the dashboard; this page explains the rules behind it.

## What counts as billable

A case is billable only when it reaches a final decision: `APPROVED` or `REJECTED`.

| Case ends as | Billable |
|---|---|
| `APPROVED` | Yes |
| `REJECTED` | Yes |
| `UNDER_REVIEW` | No (until a person decides) |
| `PENDING` | No |
| `FAILED` (bad photo, bad read, timeout) | No |

A failed read is not your applicant's fault and not your cost: the applicant can try again.

## Plans

| Plan | Included | Price |
|---|---|---|
| Free | 20 verifications each month | $0 |
| Growth | No monthly cap | $0.15 per billable verification |
| Enterprise | Custom limits and terms | Contact us |

## Check your own usage

Download the monthly report at any time: **Dashboard > Cases > Usage CSV**, or `GET /admin/account/usage/export.csv?months=12` (admin role). One row per month, with the columns `total`, `billable` and one column per status. Months are UTC.

## Currency

Prices and invoices are in US dollars. Invoicing in Turkish lira is not available yet.
