# Advanced: Countries

Armith is country independent. Nothing in the core assumes one country: country rules are plugins that sit next to a generic ICAO 9303 path.

## Supported countries

| Code | Country | Validator |
|---|---|---|
| TR | Türkiye | Dedicated: 11-digit national number with checksum, front-of-card OCR fast path |
| DE | Germany | Dedicated: Personalausweis document number |
| GB | United Kingdom | Dedicated |
| FR, ES, IT, NL, PL | France, Spain, Italy, Netherlands, Poland | Generic ICAO validator with national number formats |

`GET /kyc/countries` lists the codes enabled on your deployment. A country is supported when it has an ID card prompt and a validator. A request for any other country is refused with `UNSUPPORTED_COUNTRY`; Armith never falls back to another country's rules.

## Where the country comes from

The country of one verification is, in order: the profile's country, the session's country, the tenant configuration's country. `DEFAULT_COUNTRY_CODE` (an ISO code, default `TR`) applies only when none of those is set, so existing tenants keep working. A tenant can verify applicants from several countries; only the fallback is per tenant.

## What a country plugin contains

1. A validator (`validation/countries/`): required fields, ISO dates, nationality check, document-number format, MRZ shape (TD1, TD2 or TD3).
2. An ID card prompt (`verification/prompts/countries/<cc>/id-card.v1.yaml`).
3. An entry in `supportedCountries.js` and the policy pack map.
4. Optionally a national identifier rule. Without one, the generic rule applies: spaces, dashes, dots, slashes and invisible characters are removed and the value is upper-cased (Unicode look-alikes are folded first). "AB 123", "ab-123" and "AB123" are therefore one identity for duplicate detection and for lookups.

Adding a country is one validator, one prompt and two registry lines.

## Chip trust per country

For the NFC chip check, the operator supplies each country's CSCA certificates (and optionally master lists and CRLs) in `EID_CSCA_DIR`. Armith trusts nothing by default. See [eID NFC](/advanced/eid-nfc).

## Regulatory presets

Regulatory minimums are data, not code. Today the Video Ident rule is encoded: countries where a trained human agent is mandatory cannot be switched to an AI-only call ([Video Ident](/advanced/video-ident)).
