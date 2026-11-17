---
title: "What NFC chip verification of an ID card proves"
description: "How reading the chip of an eID card or passport works, what passive authentication proves, and what it cannot detect (a cloned chip)."
---

# What NFC chip verification of an ID card proves

Most passports and many national ID cards, including the Turkish ID card, carry a contactless chip. A phone with NFC can read it. The chip holds the same data as the printed page, plus a digital signature from the issuing country.

## What is read
- **EF.DG1**: the data of the MRZ.
- **EF.DG2**: the portrait photo.
- **EF.SOD**: the Security Object, signed by the country. It holds a hash of every data group.

## Passive authentication
The verifier checks the signature on the Security Object against the issuing country's certificates, then checks that the hashes of the data groups it received match the hashes in the signed object. If both hold, the data was signed by that country and was not changed afterwards. This is the core of chip verification and it can be done on a server, away from the phone.

Country certificates (CSCA) must be loaded by the verifier. See [CSCA certificates](/advanced/csca-sources).

## What it cannot prove
Passive authentication cannot tell a genuine chip from a **copy** of its data written to another chip. Detecting clones needs Active Authentication: the chip signs a fresh random challenge with a private key that never leaves it, and the server checks that signature against a public key that passed passive authentication.

## Why it matters for remote identity checks
A photo of an ID can be forged or replayed. A chip check ties the portrait and the personal data to a signature that is very hard to forge. The portrait read from the chip can then be compared with a live selfie. Some regulators prefer or require chip reading for remote onboarding; the rules differ by country and licence, so confirm yours with counsel.

Armith's server-side checks and their current limits (for example: not yet tested against a real card in production) are described in [eID NFC](/advanced/eid-nfc) and [Feature status](/concepts/feature-status).
