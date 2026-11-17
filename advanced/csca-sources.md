# Getting CSCA certificates

Passive Authentication needs the **Country Signing CA (CSCA)** certificates of the countries whose documents you accept. Armith ships none. This page shows where to get them, how to check them and how to load them. See [eID NFC](/advanced/eid-nfc) for what the server does with them.

::: warning You are the trust anchor
A wrong certificate in this directory makes forged documents pass. Get each file from the issuing country or from ICAO, and compare its SHA-256 fingerprint with a second source (a publication of the issuer, or the ICAO list) before you load it.
:::

## Where to get them

| Source | What you get | Notes |
|---|---|---|
| The issuing country | Its own CSCA certificates and often a link-certificate chain | Most direct. Germany publishes its CSCA material through the BSI (Federal Office for Information Security). For Turkey, ask the issuing authority and use the ICAO route to cross-check. Confirm the current download page yourself: such pages move. |
| ICAO PKD | A **master list** (a signed list of CSCA certificates from many countries) and certificate and CRL downloads | The ICAO public key directory publishes master lists for download. Joining the PKD as a participant is a separate paid programme; you do not need it to read published master lists. Check the current ICAO terms. |
| Your own reading of chips | Not a source | Never copy a CSCA out of a document you want to verify. |

A master list adds trust only for a country whose CSCA you already loaded from a plain certificate file (see below). Start with one plain CSCA file per country you care about.

## File formats

- Certificates: `.pem`, `.crt`, `.cer`, `.der`. Only CA certificates are loaded.
- Master lists: `.ml`, `.mls`.
- Revocation lists: `.crl` (DER or PEM).

## Load them

The import script checks each file and copies the good ones into the trust directory.

```bash
# See what would happen. Nothing is written.
node backend/scripts/csca-import.mjs --dry-run downloads/csca/

# Import into the directory that EID_CSCA_DIR points to.
EID_CSCA_DIR=/var/armith/csca node backend/scripts/csca-import.mjs downloads/csca/
```

The script prints the country, the SHA-256 fingerprint, the validity dates and the subject of every file. It rejects a file that is not a CA certificate, is expired or not yet valid, or expires within 90 days (change the limit with `--min-days N`). It names each import `<country>-<fingerprint prefix>.<ext>`, so you can run it again safely. It copies master lists and CRLs unchanged: the server verifies their signatures.

Then compare each printed fingerprint with your second source.

## Set it up on the server

1. Put the directory on a persistent disk.
2. Set `EID_CSCA_DIR` to its path.
3. The server re-reads the directory every ten minutes. A restart is not needed.
4. With an empty or missing directory, every chip result is held for review (`NO_TRUST_ANCHORS`).

## Keep it current

- CSCA certificates are valid for years, but countries issue new ones and link certificates. Check each country's source every quarter.
- CRLs expire quickly. Refresh them on a schedule, because Armith does not download them. A stale CRL adds `CRL_STALE`.
- The script warns about a certificate that expires within 90 days. Run it with `--dry-run` on your directory as a recurring check.

## Test it

Use a real document from a country you loaded, on a device with the Armith chip reader. A good read shows neither `SOD_CHAIN_UNTRUSTED` nor `NO_TRUST_ANCHORS`. Test one country at a time and keep the result.
