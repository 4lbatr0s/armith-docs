---
title: "How the TC Kimlik number checksum works"
description: "The two check digits of the Turkish national ID number (TC Kimlik No), with the formula, a worked example and code. A passing number is well formed, not proven to belong to a person."
---

# How the TC Kimlik number checksum works

The Turkish national identity number (TC Kimlik No) has 11 digits. The last two are check digits. They let you reject a mistyped or invented number without calling any service. You can try it in your browser with the free ID checker in the Armith web app (`/tools/id-check`): nothing you type is sent anywhere.

## The rules
Write the digits as d1 to d11.

1. The number has exactly 11 digits.
2. d1 is not 0.
3. d10 = ((d1 + d3 + d5 + d7 + d9) × 7 − (d2 + d4 + d6 + d8)) mod 10
4. d11 = (d1 + d2 + … + d10) mod 10

In rule 3 the subtraction can be negative: take the mathematical remainder, so the result is always 0 to 9.

## Worked example
Take `10000000146`.

- Odd positions: d1 + d3 + d5 + d7 + d9 = 1 + 0 + 0 + 0 + 1 = 2
- Even positions: d2 + d4 + d6 + d8 = 0
- d10 = (2 × 7 − 0) mod 10 = 14 mod 10 = **4** (matches the 10th digit)
- Sum of the first ten digits = 1 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 1 + 4 = 6
- d11 = 6 mod 10 = **6** (matches the 11th digit)

## Code
```js
export function isValidTcKimlik(value) {
  const s = String(value ?? '');
  if (!/^[1-9][0-9]{10}$/.test(s)) return false;
  const d = [...s].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}
```

## What a pass does and does not mean
A pass means the number is **well formed**. About one in a hundred random 11-digit numbers passes, so a pass is a typo filter, not identity proof. Only the issuing authority can confirm that a number was issued to a real person, and that it belongs to your applicant. Armith uses the checksum as a policy signal (`idNumberValid`): the Turkish regulation profiles reject a number that fails it, and other checks (document reading, chip data, face match) decide the rest. See [Policy rules](/advanced/policy-rules).
