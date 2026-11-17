# Is Armith right for you?

Armith is built for **small regulated firms**: crypto and payment companies in Türkiye, and small fintech and marketplaces in the EU. It is run by a small team, and this page says plainly where it fits and where it does not. It makes no claims about other vendors. Check any vendor against your own regulator's text.

## Good fit

- You need ID, selfie, liveness and AML screening behind one API, with a hosted capture page, and you have no sales-call budget.
- You want to pay per verification, with no monthly minimum and no contract. See [Pricing and billing](/pricing).
- You need rules you can read: [regulation profiles](/advanced/policy-rules) for `tr-crypto`, `tr-payments`, `eu-light` and `eu-strict`, and policy rules that can only tighten an outcome.
- You need evidence for an audit: an audit pack, four-eyes review and a re-verification due list.
- You want a human to make the final decision. Automatic approval is a setting you choose, not the default.

## Not a fit yet

- **Countries.** Eight are supported: Türkiye, Germany, France, Spain, Italy, the Netherlands, Poland and the United Kingdom. Any other country is refused with `UNSUPPORTED_COUNTRY`. See [Countries](/advanced/countries).
- **Document types.** ID cards (and passports through the generic ICAO path). Turkish driving licences and old-format ID cards have no dedicated flow yet.
- **Chip (NFC) checks.** The server-side check exists. It has not yet been tested against a real card in production, and it does not change a case status by itself. See [eID NFC](/advanced/eid-nfc).
- **Live video checks.** Video Ident is on hold. If your regulator requires a live video check today, do not rely on Armith for it.
- **Regulatory sign-off.** The Turkish and EU profiles are drafts. They are marked `confirm_with_counsel`. Your own counsel must confirm that they meet your licence conditions.
- **Languages.** The applicant flow is complete in English and Turkish. German and French are machine drafts that a native speaker has not yet reviewed.
- **Certifications and SLA.** There is no third-party certification and no contractual uptime guarantee. Support is by email.
- **Invoicing.** US dollars only. No Turkish lira invoices.

## Before you decide

1. Run a few test cases in the [sandbox](/reference/sandbox-testing).
2. Check the format of your ID numbers with the free offline checker at `/tools/id-check` in the Armith web app. It sends nothing to any server.
3. Ask your counsel to read the profile that matches your licence.
