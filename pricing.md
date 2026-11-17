# Pricing and billing rules

There is no monthly minimum and no contract. The current price list is on the pricing page in the dashboard; this page explains how usage is counted.

## What is counted

A verification is counted **once, when its ID check completes**, whatever the outcome (approved, rejected, held for review or failed on document quality). It is not counted for requests refused before the check (for example invalid input or an exhausted quota), nor for repeated requests that replay the same result.

The monthly report separates the cases that reached a final decision (`decided`: approved or rejected) from the rest, so you can see how much of your usage was decided automatically. `decided` is a reporting column, not a billing rule.

## Plans

| Plan | Included | Price |
|---|---|---|
| Free | 20 verifications each month | $0 |
| Growth | No monthly cap | $0.15 per verification |
| Enterprise | Custom limits and terms | Contact us |

## Check your own usage

Download the monthly report at any time: **Dashboard > Cases > Usage CSV**, or `GET /admin/account/usage/export.csv?months=12` (admin role). One row per month, with the columns `total`, `decided` and one column per status. It counts cases created in the month, by their current status. Months are UTC.

## Currency

Prices and invoices are in US dollars. Invoicing in Turkish lira is not available yet.
