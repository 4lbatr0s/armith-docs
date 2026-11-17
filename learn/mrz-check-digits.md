---
title: "MRZ check digits explained (ICAO 9303)"
description: "How the check digits in a passport or ID card machine-readable zone are calculated with weights 7-3-1, with a worked example from the ICAO specimen."
---

# MRZ check digits explained (ICAO 9303)

The machine-readable zone (MRZ) at the bottom of a passport or ID card holds the main fields in a fixed format and protects each important field with a check digit. A single misread character almost always changes the check digit, so software can tell a bad scan from a good one.

## Formats
- **TD3**: passports, 2 lines of 44 characters.
- **TD2**: some ID cards, 2 lines of 36 characters.
- **TD1**: ID cards, 3 lines of 30 characters.

## The calculation
1. Give every character a value: digits are 0 to 9, letters A to Z are 10 to 35, and the filler `<` is 0.
2. Multiply the values by the repeating weights **7, 3, 1** from left to right.
3. Add the products and take the sum modulo 10. The result is the check digit.

## Worked example
The ICAO specimen passport number is `L898902C3`.

| Char | L | 8 | 9 | 8 | 9 | 0 | 2 | C | 3 |
|---|---|---|---|---|---|---|---|---|---|
| Value | 21 | 8 | 9 | 8 | 9 | 0 | 2 | 12 | 3 |
| Weight | 7 | 3 | 1 | 7 | 3 | 1 | 7 | 3 | 1 |
| Product | 147 | 24 | 9 | 56 | 27 | 0 | 14 | 36 | 3 |

The sum is 316. 316 mod 10 = **6**, and the specimen MRZ carries 6 right after the number.

The same rule gives 2 for the birth date `740812` and 9 for the expiry date `120415`.

## Which fields are checked
- Document number, birth date, expiry date, and the optional data field each have their own digit.
- A final **composite** digit covers the document number, birth date, expiry date and the optional data together.

## What a pass does and does not mean
A pass proves the MRZ is internally consistent. It does not prove the document is genuine: a forger can compute correct digits. Genuineness needs more evidence, for example the chip signature ([eID NFC](/advanced/eid-nfc)) and visual checks. The free `/tools/id-check` page in the Armith web app parses a pasted MRZ (TD1, TD2, TD3) and tests every digit in your browser.
