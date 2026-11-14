# Web SDK (`@armith/web`)

The browser half of [hosted capture](/guides/hosted-capture/get-started). It opens the hosted flow in a popup (or this tab),
receives the result, and checks the `state`. It holds no secrets and does not frame the verification page.

## The flow

1. Your **server** creates a hosted session with the secret API key and gets a URL (`POST /kyc/hosted-sessions`).
2. Your page calls `start({ url, state })`. The hosted flow opens in a popup.
3. The flow ends by redirecting to **your** return URL with `?code=…&state=…` (or `?error=cancelled`, `?error=expired`).
4. The page at your return URL calls `handleReturn()`: it reports the result to the page that opened the popup and
   closes the popup.
5. Your **server** exchanges the one-time `code` for the verification result (`POST /kyc/sessions/result-code`).
   Never trust the browser's word that a person is verified.

```ts
import { start, handleReturn } from '@armith/web';

// your page
const result = await start({ url: session.url, state: session.state });
if (result.status === 'completed') await fetch('/api/kyc/finish', { method: 'POST', body: JSON.stringify({ code: result.code }) });
else showMessage(result.error); // cancelled | expired | closed | popup_blocked | state_mismatch

// your return URL page
handleReturn();
```

## Safety built in

- `state` (8+ characters, the one you gave when creating the session) is required. A success whose state differs is
  rejected as `state_mismatch`.
- The popup's message is accepted only from your popup window, from your return origin, and only of the SDK's own type.
- The session URL must be `https` (or `localhost`), carry a token, and may be limited to known hosts (`allowedHosts`).
- `mode: 'redirect'` navigates the tab instead (best on phones); a blocked popup falls back to redirect by default.
- `returnOrigin` is needed only when your return page is on another origin than the page that calls `start`.

## Why there is no iframe

Embedding a verification page needs a per-customer `frame-ancestors` policy on the hosted pages and invites
clickjacking. A popup or a redirect needs neither, and camera access works the same way.
